import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// Usage event types
export const USAGE_EVENT_TYPES = {
  API_CALL: "api_call",
  STORAGE_UPLOAD: "storage_upload",
  USER_CREATED: "user_created",
  REPORT_GENERATED: "report_generated",
  INSPECTION_COMPLETED: "inspection_completed",
  WORK_ORDER_COMPLETED: "work_order_completed",
  COMPLIANCE_CHECK: "compliance_check",
} as const;

export const usageRouter = router({
  // Record usage event
  recordUsage: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["api_call", "storage_upload", "user_created", "report_generated", "inspection_completed", "work_order_completed", "compliance_check"] as const),
        quantity: z.number().int().positive().default(1),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, store to usage_events table
        // For now, just log the event
        console.log("[Usage] Recorded event:", {
          tenantId: ctx.user.tenantId,
          companyId: ctx.user.companyId,
          userId: ctx.user.id,
          eventType: input.eventType,
          quantity: input.quantity,
          metadata: input.metadata,
          timestamp: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error("[Usage] Recording error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get usage metrics for current billing period
  getUsageMetrics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["current", "previous", "custom"]).default("current"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const now = new Date();
        let startDate = input.startDate;
        let endDate = input.endDate;

        if (input.period === "current") {
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (input.period === "previous") {
          // Previous month
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        // Mock usage data (in production, query usage_events table)
        const metrics = {
          period: {
            start: startDate,
            end: endDate,
          },
          usage: {
            apiCalls: Math.floor(Math.random() * 10000),
            storageUploadsMB: Math.floor(Math.random() * 5000),
            usersCreated: Math.floor(Math.random() * 100),
            reportsGenerated: Math.floor(Math.random() * 500),
            inspectionsCompleted: Math.floor(Math.random() * 1000),
            workOrdersCompleted: Math.floor(Math.random() * 2000),
            complianceChecks: Math.floor(Math.random() * 5000),
          },
          limits: {
            apiCallsLimit: 100000,
            storageUploadLimitMB: 100000,
            usersLimit: 1000,
            reportsLimit: 10000,
            inspectionsLimit: 50000,
            workOrdersLimit: 100000,
            complianceChecksLimit: 500000,
          },
        };

        // Calculate usage percentages
        const usage = metrics.usage as Record<string, number>;
        const limits = metrics.limits as Record<string, number>;
        const percentages: Record<string, number> = {};

        for (const key in usage) {
          const limitKey = key + "Limit";
          if (limitKey in limits) {
            percentages[key] = Math.round((usage[key] / limits[limitKey]) * 100);
          }
        }

        return {
          ...metrics,
          percentages,
        };
      } catch (error) {
        console.error("[Usage] Metrics error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Check if usage would exceed limits
  checkUsageLimit: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, check against subscription plan limits
        // For now, return mock data
        const overageRates: Record<string, number> = {
          api_call: 0.001, // $0.001 per API call
          storage_upload: 0.1, // $0.10 per MB
          user_created: 5, // $5 per user
          report_generated: 1, // $1 per report
          inspection_completed: 0.5, // $0.50 per inspection
          work_order_completed: 0.25, // $0.25 per work order
          compliance_check: 0.05, // $0.05 per check
        };

        const rate = overageRates[input.eventType] || 0;
        const overageCost = rate * input.quantity;

        return {
          eventType: input.eventType,
          quantity: input.quantity,
          withinLimit: true, // Mock: always within limit
          overageCost,
          estimatedTotal: overageCost,
        };
      } catch (error) {
        console.error("[Usage] Limit check error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get overage charges
  getOverageCharges: protectedProcedure
    .input(
      z.object({
        period: z.enum(["current", "previous", "custom"]).default("current"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const now = new Date();
        let startDate = input.startDate;
        let endDate = input.endDate;

        if (input.period === "current") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (input.period === "previous") {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        // Mock overage data
        const overages = [
          {
            eventType: "api_call",
            quantity: 5000,
            rate: 0.001,
            charge: 5.0,
          },
          {
            eventType: "storage_upload",
            quantity: 500,
            rate: 0.1,
            charge: 50.0,
          },
          {
            eventType: "user_created",
            quantity: 10,
            rate: 5,
            charge: 50.0,
          },
        ];

        const totalOverageCharge = overages.reduce((sum, o) => sum + o.charge, 0);

        return {
          period: { start: startDate, end: endDate },
          overages,
          totalOverageCharge,
          billingStatus: totalOverageCharge > 0 ? "pending" : "none",
        };
      } catch (error) {
        console.error("[Usage] Overage charges error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get usage alerts
  getUsageAlerts: protectedProcedure.query(async (opts: any) => {
    const { ctx } = opts;
    if (!ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      // Mock alerts
      const alerts = [
        {
          id: "alert-1",
          type: "usage_warning",
          message: "API calls usage at 75% of monthly limit",
          severity: "warning",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
        },
        {
          id: "alert-2",
          type: "storage_warning",
          message: "Storage usage at 60% of monthly limit",
          severity: "info",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          read: false,
        },
        {
          id: "alert-3",
          type: "overage_charge",
          message: "Overage charges of $55.00 applied this month",
          severity: "warning",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          read: true,
        },
      ];

      return alerts;
    } catch (error) {
      console.error("[Usage] Alerts error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  // Mark alert as read
  markAlertAsRead: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, update alert status in database
        return { success: true };
      } catch (error) {
        console.error("[Usage] Mark alert error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
