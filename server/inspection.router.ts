import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { applications } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "./routers";

export const inspectionRouter = router({
  // Analyze turf/site image for compliance
  analyzeImage: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        propertyId: z.number(),
        inspectionType: z.enum(["turf_health", "weed_detection", "disease_detection", "general_compliance"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Company context required" });
      }

      try {

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: buildAnalysisPrompt(input.inspectionType),
            },
            {
              role: "user",
              content: `Analyze this image for ${input.inspectionType.replace(/_/g, " ")}. ${input.notes || ""}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "inspection_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  overallCondition: {
                    type: "string",
                    enum: ["excellent", "good", "fair", "poor", "critical"],
                    description: "Overall condition assessment",
                  },
                  complianceStatus: {
                    type: "string",
                    enum: ["compliant", "at_risk", "non_compliant"],
                    description: "Compliance status",
                  },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        description: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["category", "severity", "description", "recommendation"],
                    },
                    description: "Detailed findings",
                  },
                  estimatedTurfHealth: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Estimated turf health percentage",
                  },
                  recommendedActions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommended actions",
                  },
                },
                required: [
                  "overallCondition",
                  "complianceStatus",
                  "findings",
                  "estimatedTurfHealth",
                  "recommendedActions",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const analysisResult = typeof content === "string" ? JSON.parse(content) : JSON.parse("{}");

        // Log inspection
        await logAudit({
          userId: ctx.user.id,
          companyId: ctx.user.companyId,
          eventType: "INSPECTION_COMPLETED",
          resourceType: "inspection",
          action: "analyze_image",
          changes: {
            inspectionType: input.inspectionType,
            result: analysisResult,
          },
        });

        return {
          success: true,
          analysis: analysisResult,
          timestamp: new Date(),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Image analysis failed: ${error}`,
        });
      }
    }),

  // Analyze application for compliance
  analyzeApplication: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // Get application
      const app = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (!app.length || app[0].companyId !== ctx.user.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

      try {
        // Analyze application data
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a compliance expert for lawn care and pesticide applications. 
              Analyze the provided application data for regulatory compliance.
              Consider nitrogen/phosphorus limits, prohibited substances, application timing, and local ordinances.`,
            },
            {
              role: "user",
              content: `Analyze this application for compliance:
              - Treatment Type: ${app[0].treatmentType}
              - Nitrogen Rate: ${app[0].nitrogenRate} lbs/1000sqft
              - Phosphorus Rate: ${app[0].phosphorusRate} lbs/1000sqft
              - Application Date: ${app[0].applicationDate}
              - Scheduled Date: ${app[0].scheduledDate}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "application_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  isCompliant: { type: "boolean" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  violations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rule: { type: "string" },
                        severity: { type: "string" },
                        details: { type: "string" },
                      },
                      required: ["rule", "severity", "details"],
                    },
                  },
                  recommendations: { type: "array", items: { type: "string" } },
                },
                required: ["isCompliant", "riskLevel", "violations", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const analysisResult = typeof content === "string" ? JSON.parse(content) : JSON.parse("{}");

        await logAudit({
          userId: ctx.user.id,
          companyId: ctx.user.companyId,
          eventType: "APPLICATION_ANALYZED",
          resourceType: "application",
          resourceId: String(input.applicationId),
          action: "analyze",
          changes: analysisResult,
        });

        return {
          success: true,
          analysis: analysisResult,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Application analysis failed: ${error}`,
        });
      }
    }),

});

// Build analysis prompt based on inspection type
function buildAnalysisPrompt(inspectionType: string): string {
    const prompts: Record<string, string> = {
      turf_health: `You are a turf health expert. Analyze the turf condition in this image.
        Assess overall health, identify any diseases, weeds, bare spots, or stress indicators.
        Provide specific recommendations for improvement.`,
      weed_detection: `You are a weed identification expert. Analyze this image for weeds.
        Identify specific weed species present, estimate coverage percentage, and recommend treatment options.`,
      disease_detection: `You are a plant disease expert. Analyze this image for signs of turf diseases.
        Identify any visible diseases, assess severity, and recommend treatment protocols.`,
      general_compliance: `You are a lawn care compliance expert. Analyze this property image for compliance issues.
        Check for proper maintenance, identify any regulatory concerns, and provide recommendations.`,
    };

    return prompts[inspectionType] || prompts.general_compliance;
}
