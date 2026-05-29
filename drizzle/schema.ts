import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  tenantId: int("tenantId"),
  companyId: int("companyId"),
  role: mysqlEnum("role", ["user", "admin", "manager", "field_worker"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Multi-tenancy: Tenants
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"]).default("basic"),
  active: boolean("active").default(true),
  settings: json("settings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// Multi-tenancy: Companies
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  fdacsLicense: varchar("fdacsLicense", { length: 100 }),
  county: varchar("county", { length: 100 }),
  city: varchar("city", { length: 100 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  complianceScore: decimal("complianceScore", { precision: 5, scale: 2 }).default("100"),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Compliance: Properties
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  zipCode: varchar("zipCode", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  turfSqft: decimal("turfSqft", { precision: 12, scale: 2 }),
  propertyType: mysqlEnum("propertyType", ["residential", "commercial", "municipal"]),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// Compliance: Applications (Treatments)
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  companyId: int("companyId").notNull(),
  applicatorId: int("applicatorId"),
  treatmentType: mysqlEnum("treatmentType", ["fertilizer", "pesticide", "irrigation"]).notNull(),
  applicationDate: timestamp("applicationDate"),
  scheduledDate: timestamp("scheduledDate"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending"),
  nitrogenRate: decimal("nitrogenRate", { precision: 8, scale: 2 }),
  phosphorusRate: decimal("phosphorusRate", { precision: 8, scale: 2 }),
  potassiumRate: decimal("potassiumRate", { precision: 8, scale: 2 }),
  totalAreaSqft: decimal("totalAreaSqft", { precision: 12, scale: 2 }),
  gpsCoordinates: json("gpsCoordinates"),
  notes: text("notes"),
  photos: json("photos"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// Compliance: Results & Violations
export const complianceResults = mysqlTable("complianceResults", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  propertyId: int("propertyId").notNull(),
  companyId: int("companyId").notNull(),
  isCompliant: boolean("isCompliant").notNull(),
  status: mysqlEnum("status", ["COMPLIANT", "VIOLATION"]).notNull(),
  severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  violations: json("violations"),
  validatedAt: timestamp("validatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceResult = typeof complianceResults.$inferSelect;
export type InsertComplianceResult = typeof complianceResults.$inferInsert;

// Audit: Audit Log
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 100 }).notNull().unique(),
  userId: int("userId"),
  tenantId: int("tenantId"),
  companyId: int("companyId"),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }),
  resourceId: varchar("resourceId", { length: 100 }),
  action: varchar("action", { length: 50 }),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// Work Orders
export const workOrders = mysqlTable("workOrders", {
  id: int("id").autoincrement().primaryKey(),
  workOrderId: varchar("workOrderId", { length: 100 }).notNull().unique(),
  companyId: int("companyId").notNull(),
  propertyId: int("propertyId").notNull(),
  assignedTo: int("assignedTo"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "cancelled"]).default("pending"),
  priority: mysqlEnum("priority", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

// Devices & Fleet
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 100 }).notNull().unique(),
  companyId: int("companyId").notNull(),
  tenantId: int("tenantId").notNull(),
  deviceType: mysqlEnum("deviceType", ["vehicle", "equipment", "worker_phone"]),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active"),
  lastLocationUpdate: timestamp("lastLocationUpdate"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// Telemetry: GPS Locations
export const gpsLocations = mysqlTable("gpsLocations", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  tenantId: int("tenantId").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
  speed: decimal("speed", { precision: 8, scale: 2 }),
  heading: decimal("heading", { precision: 6, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GpsLocation = typeof gpsLocations.$inferSelect;
export type InsertGpsLocation = typeof gpsLocations.$inferInsert;

// Compliance: Ordinances
export const ordinances = mysqlTable("ordinances", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  citation: varchar("citation", { length: 100 }),
  county: varchar("county", { length: 100 }),
  city: varchar("city", { length: 100 }),
  active: boolean("active").default(true),
  priority: int("priority").default(50),
  keyRequirements: json("keyRequirements"),
  prohibitedActivities: json("prohibitedActivities"),
  fineAmount: decimal("fineAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ordinance = typeof ordinances.$inferSelect;
export type InsertOrdinance = typeof ordinances.$inferInsert;

// Compliance: Violations
export const violations = mysqlTable("violations", {
  id: int("id").autoincrement().primaryKey(),
  violationId: varchar("violationId", { length: 100 }).notNull().unique(),
  applicationId: int("applicationId").notNull(),
  propertyId: int("propertyId").notNull(),
  companyId: int("companyId").notNull(),
  applicatorId: int("applicatorId"),
  severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  rulesViolated: json("rulesViolated"),
  violationDetails: json("violationDetails"),
  status: mysqlEnum("status", ["OPEN", "REMEDIATED", "ESCALATED", "CLOSED"]).default("OPEN"),
  remediationDate: timestamp("remediationDate"),
  remediationNotes: text("remediationNotes"),
  inspectorId: int("inspectorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Violation = typeof violations.$inferSelect;
export type InsertViolation = typeof violations.$inferInsert;

// Compliance: Tasks
export const complianceTasks = mysqlTable("complianceTasks", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 100 }).notNull().unique(),
  companyId: int("companyId").notNull(),
  propertyId: int("propertyId"),
  assignedTo: int("assignedTo"),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: mysqlEnum("status", ["OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE"]).default("OPEN"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceTask = typeof complianceTasks.$inferSelect;
export type InsertComplianceTask = typeof complianceTasks.$inferInsert;


// Billing & Subscription Tables
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull(),
  stripeProductId: varchar("stripeProductId", { length: 255 }).notNull(),
  price: int("price").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "annual"]).notNull(),
  maxProperties: int("maxProperties"),
  maxWorkOrders: int("maxWorkOrders"),
  maxUsers: int("maxUsers"),
  features: json("features").$type<string[]>().default([]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: varchar("subscriptionId", { length: 64 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  companyId: int("companyId").notNull(),
  planId: varchar("planId", { length: 64 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "past_due", "canceled", "trialing"]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 64 }).notNull().unique(),
  subscriptionId: varchar("subscriptionId", { length: 64 }).notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }).notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).notNull(),
  paidAt: timestamp("paidAt"),
  dueDate: timestamp("dueDate"),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export const paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  paymentMethodId: varchar("paymentMethodId", { length: 64 }).notNull().unique(),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  cardBrand: varchar("cardBrand", { length: 64 }),
  cardLast4: varchar("cardLast4", { length: 4 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

export const usageMetrics = mysqlTable("usageMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricId: varchar("metricId", { length: 64 }).notNull().unique(),
  companyId: int("companyId").notNull(),
  subscriptionId: varchar("subscriptionId", { length: 64 }).notNull(),
  propertiesCount: int("propertiesCount").default(0).notNull(),
  workOrdersCount: int("workOrdersCount").default(0).notNull(),
  usersCount: int("usersCount").default(0).notNull(),
  apiCallsCount: int("apiCallsCount").default(0).notNull(),
  storageUsedMb: int("storageUsedMb").default(0).notNull(),
  billingPeriodStart: timestamp("billingPeriodStart").notNull(),
  billingPeriodEnd: timestamp("billingPeriodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageMetrics = typeof usageMetrics.$inferSelect;
export type InsertUsageMetrics = typeof usageMetrics.$inferInsert;
