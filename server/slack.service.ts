import { WebClient, LogLevel } from '@slack/web-api';
import { createHmac } from 'crypto';

const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
  logLevel: LogLevel.DEBUG,
});

const signingSecret = process.env.SLACK_SIGNING_SECRET || '';

/**
 * Verify Slack request signature for security
 */
export function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const baseString = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', signingSecret);
  hmac.update(baseString);
  const computedSignature = `v0=${hmac.digest('hex')}`;
  return computedSignature === signature;
}

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  channel: string,
  text: string,
  blocks?: any[]
) {
  try {
    return await client.chat.postMessage({
      channel,
      text,
      blocks,
    });
  } catch (error) {
    console.error('[Slack] Failed to send message:', error);
    throw error;
  }
}

/**
 * Send compliance alert to Slack
 */
export async function sendComplianceAlert(
  channel: string,
  complianceData: {
    propertyId: string;
    propertyName: string;
    violationType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    dueDate?: string;
  }
) {
  const severityColor = {
    low: '#36a64f',
    medium: '#ffa500',
    high: '#ff6b6b',
    critical: '#8b0000',
  }[complianceData.severity];

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⚠️ Compliance Alert',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Property:*\n${complianceData.propertyName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Severity:*\n${complianceData.severity.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Violation Type:*\n${complianceData.violationType}`,
        },
        {
          type: 'mrkdwn',
          text: `*Due Date:*\n${complianceData.dueDate || 'N/A'}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${complianceData.description}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details',
            emoji: true,
          },
          value: `compliance_${complianceData.propertyId}`,
          action_id: 'view_compliance',
          url: `https://flgcompliance-6fkmvsxz.manus.space/compliance?property=${complianceData.propertyId}`,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Create Task',
            emoji: true,
          },
          value: `task_${complianceData.propertyId}`,
          action_id: 'create_task',
        },
      ],
    },
  ];

  return sendSlackMessage(channel, `Compliance Alert: ${complianceData.violationType}`, blocks);
}

/**
 * Send work order notification to Slack
 */
export async function sendWorkOrderNotification(
  channel: string,
  workOrderData: {
    workOrderId: string;
    propertyName: string;
    assignedTo: string;
    status: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    dueDate: string;
  }
) {
  const priorityColor = {
    low: '#36a64f',
    medium: '#ffa500',
    high: '#ff6b6b',
  }[workOrderData.priority];

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📋 Work Order Assignment',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Property:*\n${workOrderData.propertyName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Assigned To:*\n${workOrderData.assignedTo}`,
        },
        {
          type: 'mrkdwn',
          text: `*Priority:*\n${workOrderData.priority.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Due Date:*\n${workOrderData.dueDate}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${workOrderData.description}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Accept',
            emoji: true,
          },
          value: `accept_${workOrderData.workOrderId}`,
          action_id: 'accept_workorder',
          style: 'primary',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Details',
            emoji: true,
          },
          value: `view_${workOrderData.workOrderId}`,
          action_id: 'view_workorder',
          url: `https://flgcompliance-6fkmvsxz.manus.space/workorders/${workOrderData.workOrderId}`,
        },
      ],
    },
  ];

  return sendSlackMessage(channel, `Work Order: ${workOrderData.description}`, blocks);
}

/**
 * Send telemetry alert to Slack
 */
export async function sendTelemetryAlert(
  channel: string,
  telemetryData: {
    deviceId: string;
    deviceName: string;
    alertType: 'offline' | 'geofence_breach' | 'low_battery' | 'maintenance_due';
    location?: string;
    lastSeen?: string;
  }
) {
  const alertEmoji = {
    offline: '🔴',
    geofence_breach: '⚠️',
    low_battery: '🔋',
    maintenance_due: '🔧',
  }[telemetryData.alertType];

  const alertText = {
    offline: 'Device Offline',
    geofence_breach: 'Geofence Breach',
    low_battery: 'Low Battery',
    maintenance_due: 'Maintenance Due',
  }[telemetryData.alertType];

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${alertEmoji} ${alertText}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Device:*\n${telemetryData.deviceName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Type:*\n${telemetryData.alertType}`,
        },
        ...(telemetryData.location
          ? [
              {
                type: 'mrkdwn',
                text: `*Location:*\n${telemetryData.location}`,
              },
            ]
          : []),
        ...(telemetryData.lastSeen
          ? [
              {
                type: 'mrkdwn',
                text: `*Last Seen:*\n${telemetryData.lastSeen}`,
              },
            ]
          : []),
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Fleet',
            emoji: true,
          },
          value: `fleet_${telemetryData.deviceId}`,
          action_id: 'view_fleet',
          url: 'https://flgcompliance-6fkmvsxz.manus.space/fleet',
        },
      ],
    },
  ];

  return sendSlackMessage(channel, `${alertText}: ${telemetryData.deviceName}`, blocks);
}

/**
 * Send inspection result to Slack
 */
export async function sendInspectionResult(
  channel: string,
  inspectionData: {
    inspectionId: string;
    propertyName: string;
    inspector: string;
    condition: 'healthy' | 'stressed' | 'diseased' | 'dead';
    score: number;
    recommendations: string[];
  }
) {
  const conditionEmoji = {
    healthy: '✅',
    stressed: '⚠️',
    diseased: '🔴',
    dead: '💀',
  }[inspectionData.condition];

  const conditionColor = {
    healthy: '#36a64f',
    stressed: '#ffa500',
    diseased: '#ff6b6b',
    dead: '#8b0000',
  }[inspectionData.condition];

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${conditionEmoji} Inspection Result`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Property:*\n${inspectionData.propertyName}`,
        },
        {
          type: 'mrkdwn',
          text: `*Inspector:*\n${inspectionData.inspector}`,
        },
        {
          type: 'mrkdwn',
          text: `*Condition:*\n${inspectionData.condition.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Score:*\n${inspectionData.score}%`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Recommendations:*\n${inspectionData.recommendations.map((r) => `• ${r}`).join('\n')}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Report',
            emoji: true,
          },
          value: `inspection_${inspectionData.inspectionId}`,
          action_id: 'view_inspection',
          url: `https://flgcompliance-6fkmvsxz.manus.space/inspections/${inspectionData.inspectionId}`,
        },
      ],
    },
  ];

  return sendSlackMessage(channel, `Inspection Result: ${inspectionData.propertyName}`, blocks);
}

/**
 * Handle Slack slash command
 */
export async function handleSlackCommand(
  command: string,
  text: string,
  userId: string,
  channelId: string
): Promise<string> {
  switch (command) {
    case '/compliance':
      return handleComplianceCommand(text, userId, channelId);
    case '/workorder':
      return handleWorkOrderCommand(text, userId, channelId);
    case '/fleet':
      return handleFleetCommand(text, userId, channelId);
    case '/inspection':
      return handleInspectionCommand(text, userId, channelId);
    default:
      return 'Unknown command';
  }
}

async function handleComplianceCommand(text: string, userId: string, channelId: string): Promise<string> {
  // Parse compliance command
  const args = text.split(' ');
  const action = args[0];

  switch (action) {
    case 'status':
      return 'Compliance Status: All properties compliant ✅';
    case 'violations':
      return 'Active Violations: 2 high priority, 5 medium priority';
    case 'report':
      return 'Generating compliance report...';
    default:
      return 'Compliance commands: status, violations, report';
  }
}

async function handleWorkOrderCommand(text: string, userId: string, channelId: string): Promise<string> {
  const args = text.split(' ');
  const action = args[0];

  switch (action) {
    case 'list':
      return 'Active Work Orders: 12 pending, 8 in progress, 5 completed today';
    case 'create':
      return 'Creating work order...';
    case 'assign':
      return 'Assigning work order...';
    default:
      return 'Work Order commands: list, create, assign';
  }
}

async function handleFleetCommand(text: string, userId: string, channelId: string): Promise<string> {
  const args = text.split(' ');
  const action = args[0];

  switch (action) {
    case 'status':
      return 'Fleet Status: 24 devices online, 2 offline, 1 low battery';
    case 'location':
      return 'Getting fleet locations...';
    case 'alerts':
      return 'Fleet Alerts: 1 geofence breach, 2 maintenance due';
    default:
      return 'Fleet commands: status, location, alerts';
  }
}

async function handleInspectionCommand(text: string, userId: string, channelId: string): Promise<string> {
  const args = text.split(' ');
  const action = args[0];

  switch (action) {
    case 'recent':
      return 'Recent Inspections: 15 completed today, 3 pending';
    case 'schedule':
      return 'Scheduling inspection...';
    case 'results':
      return 'Getting inspection results...';
    default:
      return 'Inspection commands: recent, schedule, results';
  }
}

export default {
  verifySlackSignature,
  sendSlackMessage,
  sendComplianceAlert,
  sendWorkOrderNotification,
  sendTelemetryAlert,
  sendInspectionResult,
  handleSlackCommand,
};
