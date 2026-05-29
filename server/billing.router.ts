import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { subscriptionPlans, subscriptions, invoices, paymentMethods } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Subscription Plans
const PLANS = {
  starter: {
    name: "Starter",
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter",
    price: 4999, // $49.99/month
    maxProperties: 10,
    maxWorkOrders: 50,
    maxUsers: 3,
    features: ["GPS Tracking", "Basic Compliance", "Email Support"],
  },
  professional: {
    name: "Professional",
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional",
    price: 14999, // $149.99/month
    maxProperties: 100,
    maxWorkOrders: 500,
    maxUsers: 20,
    features: ["GPS Tracking", "Advanced Compliance", "AI Inspection", "Priority Support"],
  },
  enterprise: {
    name: "Enterprise",
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    price: 49999, // $499.99/month
    maxProperties: null,
    maxWorkOrders: null,
    maxUsers: null,
    features: ["All Features", "Custom Integration", "Dedicated Support", "SLA"],
  },
};

export const billingRouter = router({
  // Get available plans
  getPlans: protectedProcedure.query(async () => {
    return Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));
  }),

  // Create checkout session for subscription
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["starter", "professional", "enterprise"]),
        billingPeriod: z.enum(["monthly", "annual"]).default("monthly"),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email required for checkout",
        });
      }

      const plan = PLANS[input.planId as keyof typeof PLANS];
      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      try {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: ctx.user.email,
          line_items: [
            {
              price: plan.stripePriceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${ctx.req.headers.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${ctx.req.headers.origin}/billing/cancel`,
          metadata: {
            companyId: ctx.user.companyId?.toString(),
            userId: ctx.user.id.toString(),
            planId: input.planId,
          },
          allow_promotion_codes: true,
        });

        return {
          sessionId: session.id,
          checkoutUrl: session.url,
        };
      } catch (error) {
        console.error("[Billing] Checkout session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Get current subscription
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.companyId, ctx.user?.companyId || 0))
      .limit(1);

    if (!sub.length) return null;

    try {
      // Fetch latest subscription data from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        sub[0].stripeSubscriptionId
      );

      const sub_data = stripeSubscription as any;
      return {
        ...sub[0],
        status: stripeSubscription.status,
        currentPeriodStart: new Date((sub_data.current_period_start as number) * 1000),
        currentPeriodEnd: new Date((sub_data.current_period_end as number) * 1000),
      };
    } catch (error) {
      console.error("[Billing] Failed to fetch subscription:", error);
      return sub[0];
    }
  }),

  // Get invoices
  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(subscriptions.companyId, ctx.user?.companyId || 0)
        )
      )
      .limit(50);

    return result;
  }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async (opts: any) => {
    const { ctx } = opts;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.companyId, ctx.user?.companyId || 0))
      .limit(1);

    if (!sub.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    try {
      // Cancel at period end
      await stripe.subscriptions.update(sub[0].stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local record
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub[0].id));

      return { success: true };
    } catch (error) {
      console.error("[Billing] Subscription cancellation failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  // Update payment method
  updatePaymentMethod: protectedProcedure
    .input(
      z.object({
        stripePaymentMethodId: z.string(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.companyId, ctx.user?.companyId || 0))
        .limit(1);

      if (!sub.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found",
        });
      }

      try {
        // Update subscription's default payment method
        await stripe.subscriptions.update(sub[0].stripeSubscriptionId, {
          default_payment_method: input.stripePaymentMethodId,
        });

        return { success: true };
      } catch (error) {
        console.error("[Billing] Payment method update failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update payment method",
        });
      }
    }),

  // Get usage metrics
  getUsageMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get current subscription plan
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.companyId, ctx.user?.companyId || 0))
      .limit(1);

    if (!sub.length) return null;

    const plan = PLANS[sub[0].planId as keyof typeof PLANS];

    // In a real implementation, query actual usage from database
    return {
      plan: sub[0].planId,
      limits: {
        maxProperties: plan.maxProperties,
        maxWorkOrders: plan.maxWorkOrders,
        maxUsers: plan.maxUsers,
      },
      current: {
        propertiesCount: 0, // Would query from database
        workOrdersCount: 0,
        usersCount: 0,
      },
    };
  }),
});
