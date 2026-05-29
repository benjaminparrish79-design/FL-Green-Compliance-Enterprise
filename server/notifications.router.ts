import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";

// Notification types
export const NOTIFICATION_TYPES = {
  COMPLIANCE_DEADLINE: "compliance_deadline",
  WORK_ORDER_ASSIGNED: "work_order_assigned",
  WORK_ORDER_COMPLETED: "work_order_completed",
  GEOFENCE_BREACH: "geofence_breach",
  DEVICE_OFFLINE: "device_offline",
  DEVICE_MAINTENANCE: "device_maintenance",
  VIOLATION_DETECTED: "violation_detected",
  SUBSCRIPTION_ALERT: "subscription_alert",
  BILLING_ALERT: "billing_alert",
  INSPECTION_COMPLETE: "inspection_complete",
  SYSTEM_ALERT: "system_alert",
} as const;

export const notificationsRouter = router({
  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Mock notifications
        const notifications = [
          {
            id: "notif-1",
            userId: ctx.user.id,
            type: "compliance_deadline",
            title: "Compliance Deadline Approaching",
            message: "Application #123 has compliance deadline in 3 days",
            severity: "warning",
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            actionUrl: "/compliance/123",
          },
          {
            id: "notif-2",
            userId: ctx.user.id,
            type: "work_order_assigned",
            title: "New Work Order Assigned",
            message: "Work order #456 has been assigned to you",
            severity: "info",
            read: false,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            actionUrl: "/work-orders/456",
          },
          {
            id: "notif-3",
            userId: ctx.user.id,
            type: "geofence_breach",
            title: "Geofence Breach Alert",
            message: "Device #789 left property boundary",
            severity: "critical",
            read: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            actionUrl: "/devices/789",
          },
          {
            id: "notif-4",
            userId: ctx.user.id,
            type: "inspection_complete",
            title: "Inspection Results Ready",
            message: "AI analysis for inspection #321 is complete",
            severity: "info",
            read: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            actionUrl: "/inspections/321",
          },
        ];

        const filtered = input.unreadOnly
          ? notifications.filter((n) => !n.read)
          : notifications;

        return {
          notifications: filtered.slice(input.offset, input.offset + input.limit),
          total: filtered.length,
          unreadCount: notifications.filter((n) => !n.read).length,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("[Notifications] Get error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, update database
        console.log("[Notifications] Marked as read:", input.notificationId);
        return { success: true };
      } catch (error) {
        console.error("[Notifications] Mark read error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async (opts: any) => {
    const { ctx } = opts;
    if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      // In production, update database
      console.log("[Notifications] Marked all as read for user:", ctx.user.id);
      return { success: true };
    } catch (error) {
      console.error("[Notifications] Mark all read error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  // Delete notification
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, delete from database
        console.log("[Notifications] Deleted:", input.notificationId);
        return { success: true };
      } catch (error) {
        console.error("[Notifications] Delete error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get notification preferences
  getPreferences: protectedProcedure.query(async (opts: any) => {
    const { ctx } = opts;
    if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      // Mock preferences
      const preferences = {
        userId: ctx.user.id,
        channels: {
          inApp: true,
          email: true,
          sms: false,
          push: true,
        },
        notificationTypes: {
          compliance_deadline: { enabled: true, channels: ["email", "inApp"] },
          work_order_assigned: { enabled: true, channels: ["inApp", "push"] },
          work_order_completed: { enabled: true, channels: ["inApp"] },
          geofence_breach: { enabled: true, channels: ["email", "sms", "push"] },
          device_offline: { enabled: true, channels: ["email", "push"] },
          device_maintenance: { enabled: true, channels: ["email", "inApp"] },
          violation_detected: { enabled: true, channels: ["email", "sms", "push"] },
          subscription_alert: { enabled: true, channels: ["email"] },
          billing_alert: { enabled: true, channels: ["email"] },
          inspection_complete: { enabled: true, channels: ["inApp", "email"] },
          system_alert: { enabled: true, channels: ["email"] },
        },
        quietHours: {
          enabled: false,
          startTime: "22:00",
          endTime: "08:00",
        },
      };

      return preferences;
    } catch (error) {
      console.error("[Notifications] Get preferences error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        channels: z
          .object({
            inApp: z.boolean().optional(),
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional(),
          })
          .optional(),
        notificationTypes: z.record(z.string(), z.any()).optional(),
        quietHours: z
          .object({
            enabled: z.boolean(),
            startTime: z.string(),
            endTime: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // In production, update database
        console.log("[Notifications] Updated preferences for user:", ctx.user.id, input);
        return { success: true };
      } catch (error) {
        console.error("[Notifications] Update preferences error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Send test notification
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "compliance_deadline",
          "work_order_assigned",
          "work_order_completed",
          "geofence_breach",
          "device_offline",
          "device_maintenance",
          "violation_detected",
          "subscription_alert",
          "billing_alert",
          "inspection_complete",
          "system_alert",
        ] as const),
        channel: z.enum(["inApp", "email", "sms", "push"] as const),
      })
    )
    .mutation(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Send test notification
        console.log("[Notifications] Sending test notification:", {
          userId: ctx.user.id,
          type: input.type,
          channel: input.channel,
        });

        return {
          success: true,
          message: `Test ${input.type} notification sent via ${input.channel}`,
        };
      } catch (error) {
        console.error("[Notifications] Send test error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // Get notification statistics
  getStatistics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async (opts: any) => {
      const { ctx, input } = opts;
      if (!ctx.user?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = input.endDate || new Date();

        // Mock statistics
        const stats = {
          period: { start, end },
          totalNotifications: Math.floor(Math.random() * 1000),
          byType: {
            compliance_deadline: Math.floor(Math.random() * 100),
            work_order_assigned: Math.floor(Math.random() * 200),
            work_order_completed: Math.floor(Math.random() * 150),
            geofence_breach: Math.floor(Math.random() * 50),
            device_offline: Math.floor(Math.random() * 75),
            device_maintenance: Math.floor(Math.random() * 30),
            violation_detected: Math.floor(Math.random() * 60),
            subscription_alert: Math.floor(Math.random() * 10),
            billing_alert: Math.floor(Math.random() * 15),
            inspection_complete: Math.floor(Math.random() * 120),
            system_alert: Math.floor(Math.random() * 20),
          },
          byChannel: {
            inApp: Math.floor(Math.random() * 600),
            email: Math.floor(Math.random() * 300),
            sms: Math.floor(Math.random() * 50),
            push: Math.floor(Math.random() * 400),
          },
          readRate: Math.floor(Math.random() * 40) + 60, // 60-100%
          responseTime: Math.floor(Math.random() * 3600) + 300, // 5 mins - 1 hour in seconds
        };

        return stats;
      } catch (error) {
        console.error("[Notifications] Stats error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
