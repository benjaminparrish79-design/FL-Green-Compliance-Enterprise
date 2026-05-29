import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tenants, companies, properties, usageEvents, notifications, securityEvents, evidencePackages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Multi-tenant helpers
export async function getUserTenant(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length || !user[0].tenantId) return undefined;
  
  const tenant = await db.select().from(tenants).where(eq(tenants.id, user[0].tenantId)).limit(1);
  return tenant.length > 0 ? tenant[0] : undefined;
}

export async function getUserCompanies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length || !user[0].tenantId) return [];
  
  return db.select().from(companies).where(eq(companies.tenantId, user[0].tenantId));
}

export async function getTenantProperties(tenantId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(properties).where(and(
    eq(properties.tenantId, tenantId),
    eq(properties.companyId, companyId)
  ));
}


// Usage Events
export async function recordUsageEvent(tenantId: number, userId: number, eventType: string, resourceType?: string, quantity: number = 1, metadata?: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(usageEvents).values({ tenantId, userId, eventType, resourceType, quantity, metadata });
}

// Notifications
export async function createNotification(tenantId: number, userId: number, type: string, title: string, message: string, channels: any = {}, metadata: any = {}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ tenantId, userId, type, title, message, channels, metadata });
}

export async function getUserNotifications(tenantId: number, userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(and(eq(notifications.tenantId, tenantId), eq(notifications.userId, userId))).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true, readAt: new Date() }).where(eq(notifications.id, notificationId));
}

// Security Events
export async function recordSecurityEvent(tenantId: number, eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', description: string, userId?: number, ipAddress?: string, metadata?: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(securityEvents).values({ tenantId, userId, eventType, severity, description, ipAddress, metadata });
}

// Evidence Packages
export async function createEvidencePackage(tenantId: number, title: string, createdBy: number, files: any[], violationId?: number, complianceTaskId?: number) {
  const db = await getDb();
  if (!db) return;
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex');
  await db.insert(evidencePackages).values({ tenantId, title, createdBy, files, hash, violationId, complianceTaskId });
}
