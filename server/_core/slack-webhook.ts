import { Request, Response } from 'express';
import { verifySlackSignature, handleSlackCommand } from '../slack.service';

/**
 * Handle Slack webhook requests
 * This endpoint receives events from Slack (slash commands, button clicks, etc.)
 */
export async function handleSlackWebhook(req: any, res: Response) {
  // Get Slack headers
  const timestamp = req.headers['x-slack-request-timestamp'] as string;
  const signature = req.headers['x-slack-signature'] as string;
  const body = (req as any).rawBody || JSON.stringify(req.body);

  // Verify signature
  if (!verifySlackSignature(body, timestamp, signature)) {
    console.error('[Slack] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const payload = req.body;

  // Handle URL verification challenge
  if (payload.type === 'url_verification') {
    console.log('[Slack] URL verification challenge received');
    return res.json({ challenge: payload.challenge });
  }

  // Handle slash commands
  if (payload.type === 'slash_commands') {
    try {
      const response = await handleSlackCommand(
        payload.command,
        payload.text,
        payload.user_id,
        payload.channel_id
      );

      return res.json({
        response_type: 'in_channel',
        text: response,
      });
    } catch (error) {
      console.error('[Slack] Command error:', error);
      return res.json({
        response_type: 'ephemeral',
        text: 'Error processing command',
      });
    }
  }

  // Handle event callbacks
  if (payload.type === 'event_callback') {
    console.log('[Slack] Event received:', payload.event.type);
    // Process event asynchronously
    processSlackEvent(payload.event).catch((error) => {
      console.error('[Slack] Event processing error:', error);
    });
    return res.json({ ok: true });
  }

  // Handle interactive actions (button clicks, etc.)
  if (payload.type === 'block_actions') {
    try {
      await handleSlackAction(payload);
      return res.json({ ok: true });
    } catch (error) {
      console.error('[Slack] Action error:', error);
      return res.status(500).json({ error: 'Action processing failed' });
    }
  }

  console.warn('[Slack] Unknown payload type:', payload.type);
  return res.status(400).json({ error: 'Unknown payload type' });
}

/**
 * Process Slack events
 */
async function processSlackEvent(event: any) {
  switch (event.type) {
    case 'app_mention':
      console.log('[Slack] App mentioned by', event.user);
      break;
    case 'message':
      console.log('[Slack] Message received:', event.text);
      break;
    case 'reaction_added':
      console.log('[Slack] Reaction added:', event.reaction);
      break;
    default:
      console.log('[Slack] Event type:', event.type);
  }
}

/**
 * Handle Slack interactive actions (button clicks, etc.)
 */
async function handleSlackAction(payload: any) {
  const action = payload.actions[0];

  switch (action.action_id) {
    case 'view_compliance':
      console.log('[Slack] View compliance action:', action.value);
      break;
    case 'create_task':
      console.log('[Slack] Create task action:', action.value);
      break;
    case 'accept_workorder':
      console.log('[Slack] Accept work order action:', action.value);
      break;
    case 'view_workorder':
      console.log('[Slack] View work order action:', action.value);
      break;
    case 'view_fleet':
      console.log('[Slack] View fleet action:', action.value);
      break;
    case 'view_inspection':
      console.log('[Slack] View inspection action:', action.value);
      break;
    default:
      console.log('[Slack] Unknown action:', action.action_id);
  }
}

export default {
  handleSlackWebhook,
  processSlackEvent,
  handleSlackAction,
};
