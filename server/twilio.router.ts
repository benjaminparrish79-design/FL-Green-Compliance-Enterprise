import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  sendSMS,
  sendVoiceCall,
  sendComplianceDeadlineReminder,
  sendWorkOrderAssignment,
  sendViolationAlert,
  sendEmergencyAlert,
  sendGeofenceBreachAlert,
  sendDeviceOfflineAlert,
  sendSubscriptionRenewalReminder,
  sendPhoneVerificationOTP,
} from "./twilio.service";

export const twilioRouter = router({
  /**
   * Send SMS notification
   */
  sendSMS: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
        type: z.enum(["compliance", "work_order", "alert", "emergency"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendSMS({
        to: input.phoneNumber,
        message: input.message,
        type: input.type,
      });
      return result;
    }),

  /**
   * Send voice call notification
   */
  sendVoiceCall: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        message: z.string(),
        type: z.enum(["compliance", "work_order", "alert", "emergency"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendVoiceCall({
        to: input.phoneNumber,
        message: input.message,
        type: input.type,
      });
      return result;
    }),

  /**
   * Send compliance deadline reminder
   */
  sendComplianceDeadlineReminder: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        taskName: z.string(),
        daysUntilDue: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return sendComplianceDeadlineReminder(input.phoneNumber, input.taskName, input.daysUntilDue);
    }),

  /**
   * Send work order assignment notification
   */
  sendWorkOrderAssignment: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        workOrderId: z.string(),
        propertyName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return sendWorkOrderAssignment(input.phoneNumber, input.workOrderId, input.propertyName);
    }),

  /**
   * Send violation alert
   */
  sendViolationAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        violationType: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
      })
    )
    .mutation(async ({ input }) => {
      return sendViolationAlert(input.phoneNumber, input.violationType, input.severity);
    }),

  /**
   * Send emergency alert via voice
   */
  sendEmergencyAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        alertMessage: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return sendEmergencyAlert(input.phoneNumber, input.alertMessage);
    }),

  /**
   * Send geofence breach alert
   */
  sendGeofenceBreachAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        deviceName: z.string(),
        location: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return sendGeofenceBreachAlert(input.phoneNumber, input.deviceName, input.location);
    }),

  /**
   * Send device offline alert
   */
  sendDeviceOfflineAlert: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        deviceName: z.string(),
        lastSeenTime: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return sendDeviceOfflineAlert(input.phoneNumber, input.deviceName, input.lastSeenTime);
    }),

  /**
   * Send subscription renewal reminder
   */
  sendSubscriptionRenewalReminder: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        daysUntilRenewal: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return sendSubscriptionRenewalReminder(input.phoneNumber, input.daysUntilRenewal);
    }),

  /**
   * Send phone verification OTP
   */
  sendPhoneVerificationOTP: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        otp: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return sendPhoneVerificationOTP(input.phoneNumber, input.otp);
    }),
});
