import { getDb } from "./db";
import { applications, complianceResults, ordinances, violations, properties } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface ComplianceCheckResult {
  isCompliant: boolean;
  violations: Array<{
    ordinanceId: number;
    ordinanceName: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
  }>;
  score: number;
}

/**
 * Compliance Rules Engine
 * Evaluates applications against ordinances and regulations
 */
export class ComplianceEngine {
  /**
   * Check application for compliance violations
   */
  static async checkApplicationCompliance(
    applicationId: number,
    propertyId: number,
    companyId: number
  ): Promise<ComplianceCheckResult> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get application details
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) throw new Error("Application not found");

    const application = app[0];

    // Get property details
    const prop = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!prop.length) throw new Error("Property not found");

    const property = prop[0];

    // Get applicable ordinances for county/city
    const applicableOrdinances = await db
      .select()
      .from(ordinances)
      .where(
        and(
          eq(ordinances.active, true),
          // Match by county or city if available
        )
      );

    const violationsList: ComplianceCheckResult["violations"] = [];
    let severityScore = 100;

    // Check each ordinance
    for (const ordinance of applicableOrdinances) {
      const violation = this.evaluateOrdinance(application, property, ordinance);

      if (violation) {
        violationsList.push({
          ordinanceId: ordinance.id,
          ordinanceName: ordinance.name,
          severity: violation.severity,
          reason: violation.reason,
        });

        // Deduct points based on severity
        const severityDeduction = {
          LOW: 5,
          MEDIUM: 15,
          HIGH: 30,
          CRITICAL: 50,
        };
        severityScore -= severityDeduction[violation.severity];
      }
    }

    const isCompliant = violationsList.length === 0;
    const finalScore = Math.max(0, severityScore);

    // Record compliance result
    await db.insert(complianceResults).values({
      applicationId,
      propertyId,
      companyId,
      isCompliant,
      status: isCompliant ? "COMPLIANT" : "VIOLATION",
        severity:
          violationsList.length > 0
            ? this.getMaxSeverity(violationsList)
            : undefined,
      violations: violationsList.length > 0 ? JSON.stringify(violationsList) : null,
      validatedAt: new Date(),
      createdAt: new Date(),
    });

    return {
      isCompliant,
      violations: violationsList,
      score: finalScore,
    };
  }

  /**
   * Get maximum severity from violations list
   */
  private static getMaxSeverity(
    violations: Array<{ severity: string }>
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const severityOrder: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    let maxSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    
    for (const v of violations) {
      if (severityOrder[v.severity] > severityOrder[maxSeverity]) {
        maxSeverity = v.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      }
    }
    
    return maxSeverity;
  }

  /**
   * Evaluate a single ordinance against application
   */
  private static evaluateOrdinance(
    application: any,
    property: any,
    ordinance: any
  ): { severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; reason: string } | null {
    // Parse ordinance requirements
    const requirements = ordinance.keyRequirements
      ? JSON.parse(ordinance.keyRequirements)
      : [];
    const prohibited = ordinance.prohibitedActivities
      ? JSON.parse(ordinance.prohibitedActivities)
      : [];

    // Check prohibited activities
    if (prohibited.includes(application.treatmentType)) {
      return {
        severity: "HIGH",
        reason: `${application.treatmentType} is prohibited by ${ordinance.name}`,
      };
    }

    // Check nitrogen/phosphorus restrictions
    if (application.nitrogenRate) {
      const nitrogenRate = parseFloat(application.nitrogenRate);
      if (nitrogenRate > 0.5) {
        // Example threshold
        return {
          severity: "MEDIUM",
          reason: `Nitrogen application rate (${nitrogenRate} lbs/1000sqft) exceeds recommended limits`,
        };
      }
    }

    if (application.phosphorusRate) {
      const phosphorusRate = parseFloat(application.phosphorusRate);
      if (phosphorusRate > 0.1) {
        // Stricter phosphorus limits
        return {
          severity: "HIGH",
          reason: `Phosphorus application rate (${phosphorusRate} lbs/1000sqft) exceeds limits`,
        };
      }
    }

    // Check for required documentation
    if (requirements.includes("soil_test") && !application.soilTestId) {
      return {
        severity: "MEDIUM",
        reason: "Soil test documentation required but not provided",
      };
    }

    return null;
  }

  /**
   * Create violation record
   */
  static async createViolation(
    applicationId: number,
    propertyId: number,
    companyId: number,
    applicatorId: number | null,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    reason: string,
    details: Record<string, any>
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const violationId = `VIO-${nanoid(10)}`;

    await db.insert(violations).values({
      violationId,
      applicationId,
      propertyId,
      companyId,
      applicatorId,
      severity,
      rulesViolated: JSON.stringify([reason]),
      violationDetails: JSON.stringify(details),
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return violationId;
  }

  /**
   * Remediate violation
   */
  static async remediateViolation(
    violationId: string,
    notes: string,
    inspectorId: number
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(violations)
      .set({
        status: "REMEDIATED",
        remediationDate: new Date(),
        remediationNotes: notes,
        inspectorId,
        updatedAt: new Date(),
      })
      .where(eq(violations.violationId, violationId));
  }
}

/**
 * Compliance Score Calculator
 * Calculates company compliance scores based on violations
 */
export class ComplianceScoreCalculator {
  static async calculateCompanyScore(companyId: number): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all compliance results for company in last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const results = await db
      .select()
      .from(complianceResults)
      .where(
        and(
          eq(complianceResults.companyId, companyId),
          // Add date filter if createdAt is comparable
        )
      );

    if (results.length === 0) return 100;

    const compliantCount = results.filter((r) => r.isCompliant).length;
    const complianceRate = (compliantCount / results.length) * 100;

    // Calculate score with violation severity weighting
    let totalDeduction = 0;
    for (const result of results) {
      if (!result.isCompliant) {
        const severityDeduction = {
          LOW: 2,
          MEDIUM: 5,
          HIGH: 10,
          CRITICAL: 20,
        };
        totalDeduction += severityDeduction[result.severity as keyof typeof severityDeduction] || 0;
      }
    }

    const score = Math.max(0, 100 - totalDeduction);
    return Math.round(score);
  }
}
