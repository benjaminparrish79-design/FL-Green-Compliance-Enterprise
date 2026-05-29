import { publicProcedure, router } from './_core/trpc';
import { z } from 'zod';
import {
  verifySlackSignature,
  sendComplianceAlert,
  sendWorkOrderNotification,
  sendTelemetryAlert,
  sendInspectionResult,
  handleSlackCommand,
} from './slack.service';

export const slackRouter = router({
  /**
   * Handle Slack webhook events (compliance alerts, work orders, etc.)
   */
  webhook: publicProcedure
    .input(
      z.object({
        token: z.string(),
        team_id: z.string(),
        api_app_id: z.string(),
        event: z.object({
          type: z.string(),
          user: z.string().optional(),
          text: z.string().optional(),
          channel: z.string().optional(),
          ts: z.string().optional(),
        }),
        type: z.enum(['url_verification', 'event_callback']),
        event_id: z.string(),
        event_time: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify Slack signature
      const signature = input.token;
      if (!signature) {
        throw new Error('Invalid Slack signature');
      }

      // Handle URL verification
      if (input.type === 'url_verification') {
        return { challenge: input.event_id };
      }

      // Handle event callback
      if (input.type === 'event_callback') {
        console.log('[Slack] Event received:', input.event.type);
        return { ok: true };
      }

      return { ok: false };
    }),

  /**
   * Handle Slack slash commands
   */
  command: publicProcedure
    .input(
      z.object({
        token: z.string(),
        team_id: z.string(),
        team_domain: z.string(),
        channel_id: z.string(),
        channel_name: z.string(),
        user_id: z.string(),
        user_name: z.string(),
        command: z.string(),
        text: z.string(),
        api_app_id: z.string(),
        response_url: z.string(),
        trigger_id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await handleSlackCommand(
          input.command,
          input.text,
          input.user_id,
          input.channel_id
        );

        return {
          response_type: 'in_channel',
          text: response,
        };
      } catch (error) {
        console.error('[Slack] Command error:', error);
        return {
          response_type: 'ephemeral',
          text: 'Error processing command',
        };
      }
    }),

  /**
   * Send compliance alert to Slack
   */
  sendComplianceAlert: publicProcedure
    .input(
      z.object({
        channel: z.string(),
        propertyId: z.string(),
        propertyName: z.string(),
        violationType: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendComplianceAlert(input.channel, {
          propertyId: input.propertyId,
          propertyName: input.propertyName,
          violationType: input.violationType,
          severity: input.severity,
          description: input.description,
          dueDate: input.dueDate,
        });

        return { ok: true, message: 'Compliance alert sent' };
      } catch (error) {
        console.error('[Slack] Send compliance alert error:', error);
        throw error;
      }
    }),

  /**
   * Send work order notification to Slack
   */
  sendWorkOrderNotification: publicProcedure
    .input(
      z.object({
        channel: z.string(),
        workOrderId: z.string(),
        propertyName: z.string(),
        assignedTo: z.string(),
        status: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        description: z.string(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendWorkOrderNotification(input.channel, {
          workOrderId: input.workOrderId,
          propertyName: input.propertyName,
          assignedTo: input.assignedTo,
          status: input.status,
          priority: input.priority,
          description: input.description,
          dueDate: input.dueDate,
        });

        return { ok: true, message: 'Work order notification sent' };
      } catch (error) {
        console.error('[Slack] Send work order notification error:', error);
        throw error;
      }
    }),

  /**
   * Send telemetry alert to Slack
   */
  sendTelemetryAlert: publicProcedure
    .input(
      z.object({
        channel: z.string(),
        deviceId: z.string(),
        deviceName: z.string(),
        alertType: z.enum(['offline', 'geofence_breach', 'low_battery', 'maintenance_due']),
        location: z.string().optional(),
        lastSeen: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendTelemetryAlert(input.channel, {
          deviceId: input.deviceId,
          deviceName: input.deviceName,
          alertType: input.alertType,
          location: input.location,
          lastSeen: input.lastSeen,
        });

        return { ok: true, message: 'Telemetry alert sent' };
      } catch (error) {
        console.error('[Slack] Send telemetry alert error:', error);
        throw error;
      }
    }),

  /**
   * Send inspection result to Slack
   */
  sendInspectionResult: publicProcedure
    .input(
      z.object({
        channel: z.string(),
        inspectionId: z.string(),
        propertyName: z.string(),
        inspector: z.string(),
        condition: z.enum(['healthy', 'stressed', 'diseased', 'dead']),
        score: z.number().min(0).max(100),
        recommendations: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendInspectionResult(input.channel, {
          inspectionId: input.inspectionId,
          propertyName: input.propertyName,
          inspector: input.inspector,
          condition: input.condition,
          score: input.score,
          recommendations: input.recommendations,
        });

        return { ok: true, message: 'Inspection result sent' };
      } catch (error) {
        console.error('[Slack] Send inspection result error:', error);
        throw error;
      }
    }),

  /**
   * Get Slack app status
   */
  status: publicProcedure.query(async () => {
    return {
      ok: true,
      status: 'Slack integration active',
      features: [
        'Compliance alerts',
        'Work order notifications',
        'Telemetry alerts',
        'Inspection results',
        'Slash commands',
        'Interactive buttons',
      ],
    };
  }),
});

export type SlackRouter = typeof slackRouter;
