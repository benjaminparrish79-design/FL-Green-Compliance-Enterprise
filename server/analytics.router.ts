import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  workOrders, 
  complianceResults, 
  violations, 
  applications, 
  auditLog,
  gpsLocations,
  complianceTasks 
} from "../drizzle/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

export const analyticsRouter = router({
  // Compliance Analytics
  getComplianceMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate || new Date();

      try {
        // Total applications
        const totalApps = await db
          .select({ count: count() })
          .from(applications)
          .where(and(
            eq(applications.companyId, ctx.user.companyId),
            gte(applications.createdAt, start),
            lte(applications.createdAt, end)
          ));

        // Compliant vs violations
        const results = await db
          .select({ 
            status: complianceResults.status,
            count: count()
          })
          .from(complianceResults)
          .where(and(
            eq(complianceResults.companyId, ctx.user.companyId),
            gte(complianceResults.createdAt, start),
            lte(complianceResults.createdAt, end)
          ))
          .groupBy(complianceResults.status);

        // Violations by severity
        const severities = await db
          .select({
            severity: violations.severity,
            count: count()
          })
          .from(violations)
          .where(and(
            eq(violations.companyId, ctx.user.companyId),
            gte(violations.createdAt, start),
            lte(violations.createdAt, end)
          ))
          .groupBy(violations.severity);

        return {
          totalApplications: totalApps[0]?.count || 0,
          complianceStatus: results.reduce((acc: any, r: any) => {
            acc[r.status] = r.count;
            return acc;
          }, {}),
          violationsBySeverity: severities.reduce((acc: any, s: any) => {
            acc[s.severity] = s.count;
            return acc;
          }, {}),
          dateRange: { start, end }
        };
      } catch (error) {
        console.error("[Analytics] Compliance metrics error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Work Order Analytics
  getWorkOrderMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate || new Date();

      try {
        // Work orders by status
        const statuses = await db
          .select({
            status: workOrders.status,
            count: count()
          })
          .from(workOrders)
          .where(and(
            eq(workOrders.companyId, ctx.user.companyId),
            gte(workOrders.createdAt, start),
            lte(workOrders.createdAt, end)
          ))
          .groupBy(workOrders.status);

        // Work orders by priority
        const priorities = await db
          .select({
            priority: workOrders.priority,
            count: count()
          })
          .from(workOrders)
          .where(and(
            eq(workOrders.companyId, ctx.user.companyId),
            gte(workOrders.createdAt, start),
            lte(workOrders.createdAt, end)
          ))
          .groupBy(workOrders.priority);

        return {
          statusDistribution: statuses.reduce((acc: any, s: any) => {
            acc[s.status] = s.count;
            return acc;
          }, {}),
          priorityDistribution: priorities.reduce((acc: any, p: any) => {
            acc[p.priority] = p.count;
            return acc;
          }, {}),
          dateRange: { start, end }
        };
      } catch (error) {
        console.error("[Analytics] Work order metrics error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // User Activity Analytics
  getUserActivityMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate || new Date();

      try {
        // Events by type
        const eventTypes = await db
          .select({
            eventType: auditLog.eventType,
            count: count()
          })
          .from(auditLog)
          .where(and(
            eq(auditLog.companyId, ctx.user.companyId),
            gte(auditLog.createdAt, start),
            lte(auditLog.createdAt, end)
          ))
          .groupBy(auditLog.eventType);

        // Events by action
        const actions = await db
          .select({
            action: auditLog.action,
            count: count()
          })
          .from(auditLog)
          .where(and(
            eq(auditLog.companyId, ctx.user.companyId),
            gte(auditLog.createdAt, start),
            lte(auditLog.createdAt, end)
          ))
          .groupBy(auditLog.action);

        return {
          eventsByType: eventTypes.reduce((acc: any, e: any) => {
            acc[e.eventType] = e.count;
            return acc;
          }, {}),
          eventsByAction: actions.reduce((acc: any, a: any) => {
            acc[a.action] = a.count;
            return acc;
          }, {}),
          dateRange: { start, end }
        };
      } catch (error) {
        console.error("[Analytics] User activity metrics error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Compliance Tasks Analytics
  getTaskMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate || new Date();

      try {
        // Tasks by status
        const statuses = await db
          .select({
            status: complianceTasks.status,
            count: count()
          })
          .from(complianceTasks)
          .where(and(
            eq(complianceTasks.companyId, ctx.user.companyId),
            gte(complianceTasks.createdAt, start),
            lte(complianceTasks.createdAt, end)
          ))
          .groupBy(complianceTasks.status);

        // Tasks by priority
        const priorities = await db
          .select({
            priority: complianceTasks.priority,
            count: count()
          })
          .from(complianceTasks)
          .where(and(
            eq(complianceTasks.companyId, ctx.user.companyId),
            gte(complianceTasks.createdAt, start),
            lte(complianceTasks.createdAt, end)
          ))
          .groupBy(complianceTasks.priority);

        return {
          statusDistribution: statuses.reduce((acc: any, s: any) => {
            acc[s.status] = s.count;
            return acc;
          }, {}),
          priorityDistribution: priorities.reduce((acc: any, p: any) => {
            acc[p.priority] = p.count;
            return acc;
          }, {}),
          dateRange: { start, end }
        };
      } catch (error) {
        console.error("[Analytics] Task metrics error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Device Telemetry Analytics
  getTelemetryMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const start = input.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = input.endDate || new Date();

      try {
        // Total GPS locations recorded
        const totalLocations = await db
          .select({ count: count() })
          .from(gpsLocations)
          .where(and(
            eq(gpsLocations.tenantId, ctx.user.tenantId),
            gte(gpsLocations.createdAt, start),
            lte(gpsLocations.createdAt, end)
          ));

        // Average speed
        const avgSpeed = await db
          .select({
            avgSpeed: sql`AVG(CAST(${gpsLocations.speed} AS DECIMAL(8,2)))`
          })
          .from(gpsLocations)
          .where(and(
            eq(gpsLocations.tenantId, ctx.user.tenantId),
            gte(gpsLocations.createdAt, start),
            lte(gpsLocations.createdAt, end)
          ));

        return {
          totalLocations: totalLocations[0]?.count || 0,
          averageSpeed: avgSpeed[0]?.avgSpeed || 0,
          dateRange: { start, end }
        };
      } catch (error) {
        console.error("[Analytics] Telemetry metrics error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
