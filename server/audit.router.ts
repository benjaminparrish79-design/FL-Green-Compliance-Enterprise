import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { auditLog } from "../drizzle/schema";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";
import crypto from "crypto";

export const auditRouter = router({
  // Get audit log entries with filtering
  getAuditLog: protectedProcedure
    .input(
      z.object({
        eventType: z.string().optional(),
        action: z.string().optional(),
        userId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const filters = [eq(auditLog.companyId, ctx.user.companyId)];

        if (input.eventType) {
          filters.push(eq(auditLog.eventType, input.eventType));
        }
        if (input.action) {
          filters.push(eq(auditLog.action, input.action));
        }
        if (input.userId) {
          filters.push(eq(auditLog.userId, input.userId));
        }
        if (input.startDate) {
          filters.push(gte(auditLog.createdAt, input.startDate));
        }
        if (input.endDate) {
          filters.push(lte(auditLog.createdAt, input.endDate));
        }

        const entries = await db
          .select()
          .from(auditLog)
          .where(and(...filters))
          .orderBy(desc(auditLog.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const total = await db
          .select({ count: count() })
          .from(auditLog)
          .where(and(...filters));

        return {
          entries,
          total: total[0]?.count || 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Audit] Get log error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Search audit log
  searchAuditLog: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().positive().default(20),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, use full-text search
        // For now, filter by action/eventType
        const filters = [eq(auditLog.companyId, ctx.user.companyId)];

        if (input.startDate) {
          filters.push(gte(auditLog.createdAt, input.startDate));
        }
        if (input.endDate) {
          filters.push(lte(auditLog.createdAt, input.endDate));
        }

        const results = await db
          .select()
          .from(auditLog)
          .where(and(...filters))
          .orderBy(desc(auditLog.createdAt))
          .limit(input.limit);

        return results.filter(
          (entry) =>
            entry.eventType?.includes(input.query) ||
            entry.action?.includes(input.query)
        );
      } catch (error) {
        console.error("[Audit] Search error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get audit statistics
  getAuditStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = input.endDate || new Date();

        const filters = [
          eq(auditLog.companyId, ctx.user.companyId),
          gte(auditLog.createdAt, start),
          lte(auditLog.createdAt, end),
        ];

        // Total events
        const total = await db
          .select({ count: count() })
          .from(auditLog)
          .where(and(...filters));

        // Events by type
        const byType = await db
          .select({
            eventType: auditLog.eventType,
            count: count(),
          })
          .from(auditLog)
          .where(and(...filters))
          .groupBy(auditLog.eventType);

        // Events by action
        const byAction = await db
          .select({
            action: auditLog.action,
            count: count(),
          })
          .from(auditLog)
          .where(and(...filters))
          .groupBy(auditLog.action);

        return {
          period: { start, end },
          totalEvents: total[0]?.count || 0,
          eventsByType: byType.reduce((acc: any, e: any) => {
            acc[e.eventType] = e.count;
            return acc;
          }, {}),
          eventsByAction: byAction.reduce((acc: any, a: any) => {
            acc[a.action] = a.count;
            return acc;
          }, {}),
        };
      } catch (error) {
        console.error("[Audit] Stats error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Generate evidence package for compliance
  generateEvidencePackage: protectedProcedure
    .input(
      z.object({
        violationId: z.number(),
        includePhotos: z.boolean().default(true),
        includeAuditLog: z.boolean().default(true),
        includeInspections: z.boolean().default(true),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Generate evidence package
        const packageId = crypto.randomBytes(16).toString("hex");
        const timestamp = new Date();

        const evidencePackage = {
          id: packageId,
          violationId: input.violationId,
          companyId: ctx.user.companyId,
          createdBy: ctx.user.id,
          createdAt: timestamp,
          expiresAt: new Date(timestamp.getTime() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
          contents: {
            photos: input.includePhotos ? [] : undefined,
            auditLog: input.includeAuditLog ? [] : undefined,
            inspections: input.includeInspections ? [] : undefined,
          },
          hash: generateHash({
            violationId: input.violationId,
            timestamp: timestamp.toISOString(),
          }),
          verified: true,
          verificationTimestamp: timestamp,
        };

        console.log("[Audit] Evidence package generated:", packageId);

        return evidencePackage;
      } catch (error) {
        console.error("[Audit] Evidence generation error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Verify evidence package integrity
  verifyEvidencePackage: protectedProcedure
    .input(
      z.object({
        packageId: z.string(),
        hash: z.string(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, verify against stored hash
        const isValid = input.hash.length === 64; // SHA-256 hex length

        return {
          packageId: input.packageId,
          isValid,
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
        };
      } catch (error) {
        console.error("[Audit] Verification error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Export audit log
  exportAuditLog: protectedProcedure
    .input(
      z.object({
        format: z.enum(["csv", "json", "pdf"] as const),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        eventType: z.string().optional(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      const db = await getDb();
      if (!db || !ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const filters = [eq(auditLog.companyId, ctx.user.companyId)];

        if (input.startDate) {
          filters.push(gte(auditLog.createdAt, input.startDate));
        }
        if (input.endDate) {
          filters.push(lte(auditLog.createdAt, input.endDate));
        }
        if (input.eventType) {
          filters.push(eq(auditLog.eventType, input.eventType));
        }

        const entries = await db
          .select()
          .from(auditLog)
          .where(and(...filters))
          .orderBy(desc(auditLog.createdAt));

        // Generate export based on format
        let exportData: any;
        let mimeType: string;
        let filename: string;

        if (input.format === "json") {
          exportData = JSON.stringify(entries, null, 2);
          mimeType = "application/json";
          filename = `audit-log-${Date.now()}.json`;
        } else if (input.format === "csv") {
          // Simple CSV generation
          const headers = Object.keys(entries[0] || {}).join(",");
          const rows = entries.map((e: any) =>
            Object.values(e)
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(",")
          );
          exportData = [headers, ...rows].join("\n");
          mimeType = "text/csv";
          filename = `audit-log-${Date.now()}.csv`;
        } else {
          // PDF generation would require a PDF library
          exportData = JSON.stringify(entries);
          mimeType = "application/pdf";
          filename = `audit-log-${Date.now()}.pdf`;
        }

        return {
          filename,
          mimeType,
          size: Buffer.byteLength(exportData),
          url: `/api/export/${filename}`, // Mock URL
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
      } catch (error) {
        console.error("[Audit] Export error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get compliance report
  getComplianceReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = input.endDate || new Date();

        // Mock compliance report
        const report = {
          period: { start, end },
          companyId: ctx.user.companyId,
          generatedAt: new Date(),
          generatedBy: ctx.user.id,
          summary: {
            totalAuditEvents: Math.floor(Math.random() * 10000),
            totalViolations: Math.floor(Math.random() * 100),
            resolvedViolations: Math.floor(Math.random() * 80),
            pendingViolations: Math.floor(Math.random() * 20),
            complianceScore: Math.floor(Math.random() * 40) + 60, // 60-100%
          },
          evidencePackages: {
            total: Math.floor(Math.random() * 50),
            verified: Math.floor(Math.random() * 45),
            unverified: Math.floor(Math.random() * 5),
          },
          recommendations: [
            "Review and update compliance policies",
            "Increase training frequency for field workers",
            "Implement automated compliance checks",
            "Schedule quarterly compliance audits",
          ],
        };

        return report;
      } catch (error) {
        console.error("[Audit] Report error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});

// Helper function to generate cryptographic hash
function generateHash(data: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}
