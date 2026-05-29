import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { ComplianceEngine, ComplianceScoreCalculator } from "./compliance";
import { complianceTasks, violations, ordinances, complianceResults } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "manager"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
  }
  return next({ ctx });
});

export const complianceRouter = router({
  // Check application compliance
  checkApplication: managerProcedure
    .input(
      z.object({
        applicationId: z.number(),
        propertyId: z.number(),
        companyId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await ComplianceEngine.checkApplicationCompliance(
          input.applicationId,
          input.propertyId,
          input.companyId
        );

        return {
          success: true,
          isCompliant: result.isCompliant,
          violations: result.violations,
          score: result.score,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Compliance check failed: ${error}`,
        });
      }
    }),

  // Create compliance task
  createTask: managerProcedure
    .input(
      z.object({
        companyId: z.number(),
        propertyId: z.number().optional(),
        type: z.string(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const taskId = `TASK-${nanoid(10)}`;

      await db.insert(complianceTasks).values({
        taskId,
        companyId: input.companyId,
        propertyId: input.propertyId,
        assignedTo: ctx.user.id,
        type: input.type,
        title: input.title,
        description: input.description,
        priority: input.priority || "MEDIUM",
        status: "OPEN",
        dueDate: input.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, taskId };
    }),

  // List compliance tasks
  listTasks: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(complianceTasks)
        .where(eq(complianceTasks.companyId, input.companyId));
    }),

  // Update task status
  updateTaskStatus: managerProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE"]),
        completedNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: any = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "COMPLETED") {
        updateData.completedAt = new Date();
        updateData.completedBy = ctx.user.id;
      }

      await db
        .update(complianceTasks)
        .set(updateData)
        .where(eq(complianceTasks.taskId, input.taskId));

      return { success: true };
    }),

  // Get compliance results
  getResults: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(complianceResults)
        .where(eq(complianceResults.companyId, input.companyId));
    }),

  // Get violations
  getViolations: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(violations)
        .where(eq(violations.companyId, input.companyId));
    }),

  // Remediate violation
  remediateViolation: managerProcedure
    .input(
      z.object({
        violationId: z.string(),
        remediationNotes: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ComplianceEngine.remediateViolation(
          input.violationId,
          input.remediationNotes,
          ctx.user.id
        );

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to remediate violation: ${error}`,
        });
      }
    }),

  // Get company compliance score
  getComplianceScore: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      try {
        const score = await ComplianceScoreCalculator.calculateCompanyScore(
          input.companyId
        );

        return { score, status: score >= 80 ? "COMPLIANT" : "AT_RISK" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to calculate score: ${error}`,
        });
      }
    }),

  // List ordinances
  listOrdinances: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(ordinances)
        .where(and(eq(ordinances.tenantId, input.tenantId), eq(ordinances.active, true)));
    }),
});
