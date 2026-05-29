import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { workOrders, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logAudit } from "./routers";

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "manager"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
  }
  return next({ ctx });
});

export const workOrderRouter = router({
  // List work orders for company
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(workOrders)
        .where(eq(workOrders.companyId, input.companyId));
    }),

  // Get work order details
  get: protectedProcedure
    .input(z.object({ workOrderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.workOrderId, input.workOrderId))
        .limit(1);

      if (!result.length) return null;

      const wo = result[0];

      // Verify access
      if (wo.companyId !== ctx.user.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return wo;
    }),

  // Assign work order to user
  assign: managerProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        assignedTo: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get work order
      const wo = await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.workOrderId, input.workOrderId))
        .limit(1);

      if (!wo.length || wo[0].companyId !== ctx.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }

      // Verify assigned user exists and belongs to company
      const assignedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, input.assignedTo))
        .limit(1);

      if (!assignedUser.length || assignedUser[0].companyId !== ctx.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Update assignment
      await db
        .update(workOrders)
        .set({
          assignedTo: input.assignedTo,
          status: "assigned",
          updatedAt: new Date(),
        })
        .where(eq(workOrders.workOrderId, input.workOrderId));

      await logAudit({
        userId: ctx.user.id,
        companyId: ctx.user.companyId,
        eventType: "WORK_ORDER_ASSIGNED",
        resourceType: "workOrder",
        resourceId: input.workOrderId,
        action: "assign",
        changes: { assignedTo: input.assignedTo },
      });

      return { success: true };
    }),

  // Update work order status
  updateStatus: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get work order
      const wo = await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.workOrderId, input.workOrderId))
        .limit(1);

      if (!wo.length || wo[0].companyId !== ctx.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
      }

      // Verify permission: only assigned user or manager can update
      if (
        ctx.user.role !== "admin" &&
        ctx.user.role !== "manager" &&
        wo[0].assignedTo !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot update this work order" });
      }

      // Update status
      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "completed") {
        updateData.completedAt = new Date();
        updateData.completedBy = ctx.user.id;
      }

      await db
        .update(workOrders)
        .set(updateData)
        .where(eq(workOrders.workOrderId, input.workOrderId));

      await logAudit({
        userId: ctx.user.id,
        companyId: ctx.user.companyId,
        eventType: "WORK_ORDER_UPDATED",
        resourceType: "workOrder",
        resourceId: input.workOrderId,
        action: "update_status",
        changes: { status: input.status, notes: input.notes },
      });

      return { success: true };
    }),

  // Get work orders assigned to user
  getMyWorkOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.companyId) return [];

    return db
      .select()
      .from(workOrders)
      .where(
        and(
          eq(workOrders.companyId, ctx.user.companyId),
          eq(workOrders.assignedTo, ctx.user.id)
        )
      );
  }),

  // Get work order statistics
  getStats: managerProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const allWO = await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.companyId, input.companyId));

      const stats = {
        total: allWO.length,
        pending: allWO.filter((wo) => wo.status === "pending").length,
        assigned: allWO.filter((wo) => wo.status === "assigned").length,
        inProgress: allWO.filter((wo) => wo.status === "in_progress").length,
        completed: allWO.filter((wo) => wo.status === "completed").length,
        cancelled: allWO.filter((wo) => wo.status === "cancelled").length,
      };

      return stats;
    }),
});
