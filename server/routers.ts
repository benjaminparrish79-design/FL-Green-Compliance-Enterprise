import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { tenants, companies, properties, applications, complianceResults, workOrders, devices, gpsLocations, auditLog } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { complianceRouter } from "./compliance.router";
import { telemetryRouter } from "./telemetry.router";
import { workOrderRouter } from "./workorder.router";
import { inspectionRouter } from "./inspection.router";
import { billingRouter } from "./billing.router";

// RBAC Procedure Guards
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "manager"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
  return next({ ctx });
});

// Multi-tenancy context builder
export const withTenantContext = protectedProcedure.use(async ({ ctx, next }) => {
  const db = await getDb();
  if (!db || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Tenant context required" });
  
  const tenant = await db.select().from(tenants).where(eq(tenants.id, ctx.user.tenantId)).limit(1);
  if (!tenant.length) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
  
  return next({ ctx: { ...ctx, tenant: tenant[0] } });
});

// Audit logging helper
export async function logAudit({
  userId,
  tenantId,
  companyId,
  eventType,
  resourceType,
  resourceId,
  action,
  changes,
  ipAddress,
}: {
  userId?: number;
  tenantId?: number;
  companyId?: number;
  eventType: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  changes?: any;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(auditLog).values({
    eventId: nanoid(),
    userId,
    tenantId,
    companyId,
    eventType,
    resourceType,
    resourceId,
    action,
    changes: changes ? JSON.stringify(changes) : null,
    ipAddress,
    createdAt: new Date(),
  }).catch(err => console.error("Audit log error:", err));
}

export const appRouter = router({
  system: systemRouter,
  billing: billingRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Tenant Management
  tenants: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(tenants).where(eq(tenants.active, true));
    }),
    
    create: adminProcedure.input(z.object({ name: z.string(), slug: z.string() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const result = await db.insert(tenants).values({
        name: input.name,
        slug: input.slug,
        plan: "basic",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await logAudit({
        userId: ctx.user.id,
        eventType: "TENANT_CREATED",
        resourceType: "tenant",
        action: "create",
        changes: input,
      });
      
      return { success: true };
    }),
  }),

  // Company Management
  companies: router({
    list: withTenantContext.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(companies).where(and(
        eq(companies.tenantId, ctx.user.tenantId!),
        eq(companies.active, true)
      ));
    }),
    
    create: managerProcedure.input(z.object({
      name: z.string(),
      licenseNumber: z.string().optional(),
      county: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await db.insert(companies).values({
        tenantId: ctx.user.tenantId,
        name: input.name,
        licenseNumber: input.licenseNumber,
        county: input.county,
        active: true,
        complianceScore: "100",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await logAudit({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        eventType: "COMPANY_CREATED",
        resourceType: "company",
        action: "create",
        changes: input,
      });
      
      return { success: true };
    }),
  }),

  // Property Management
  properties: router({
    list: withTenantContext.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) return [];
      return db.select().from(properties).where(and(
        eq(properties.companyId, ctx.user.companyId),
        eq(properties.tenantId, ctx.user.tenantId!),
        eq(properties.active, true)
      ));
    }),
    
    create: managerProcedure.input(z.object({
      name: z.string(),
      address: z.string(),
      city: z.string().optional(),
      county: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      turfSqft: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId || !ctx.user.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      await db.insert(properties).values({
        companyId: ctx.user.companyId,
        tenantId: ctx.user.tenantId,
        name: input.name,
        address: input.address,
        city: input.city,
        county: input.county,
        latitude: input.latitude ? String(input.latitude) : null,
        longitude: input.longitude ? String(input.longitude) : null,
        turfSqft: input.turfSqft ? String(input.turfSqft) : null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await logAudit({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        companyId: ctx.user.companyId,
        eventType: "PROPERTY_CREATED",
        resourceType: "property",
        action: "create",
        changes: input,
      });
      
      return { success: true };
    }),
  }),

  // Work Orders
  workOrders: router({
    list: withTenantContext.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) return [];
      return db.select().from(workOrders).where(eq(workOrders.companyId, ctx.user.companyId));
    }),
    
    create: managerProcedure.input(z.object({
      propertyId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const workOrderId = `WO-${nanoid(10)}`;
      await db.insert(workOrders).values({
        workOrderId,
        companyId: ctx.user.companyId,
        propertyId: input.propertyId,
        title: input.title,
        description: input.description,
        priority: input.priority || "MEDIUM",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await logAudit({
        userId: ctx.user.id,
        companyId: ctx.user.companyId,
        eventType: "WORK_ORDER_CREATED",
        resourceType: "workOrder",
        resourceId: workOrderId,
        action: "create",
        changes: input,
      });
      
      return { success: true, workOrderId };
    }),
  }),

  // Devices & Fleet
  devices: router({
    list: withTenantContext.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) return [];
      return db.select().from(devices).where(eq(devices.companyId, ctx.user.companyId));
    }),
    
    create: managerProcedure.input(z.object({
      deviceType: z.enum(["vehicle", "equipment", "worker_phone"]),
      name: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId || !ctx.user.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const deviceId = `DEV-${nanoid(10)}`;
      await db.insert(devices).values({
        deviceId,
        companyId: ctx.user.companyId,
        tenantId: ctx.user.tenantId,
        deviceType: input.deviceType,
        name: input.name,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await logAudit({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        companyId: ctx.user.companyId,
        eventType: "DEVICE_CREATED",
        resourceType: "device",
        resourceId: deviceId,
        action: "create",
        changes: input,
      });
      
      return { success: true, deviceId };
    }),
  }),

  // Compliance Router
  compliance: complianceRouter,

  // Telemetry Router
  telemetry: telemetryRouter,

  // Work Order Router
  workorder: workOrderRouter,

  // Inspection Router
  inspection: inspectionRouter,
});

export type AppRouter = typeof appRouter;

// Export routers for use in other modules
export { complianceRouter, telemetryRouter, workOrderRouter, inspectionRouter };
