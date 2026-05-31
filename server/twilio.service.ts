import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn('[Twilio] Missing credentials - SMS/Voice notifications will not work. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.');
}

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

export interface SMSNotification {
  to: string;
  message: string;
  type: "compliance" | "work_order" | "alert" | "emergency";
}

export interface VoiceNotification {
  to: string;
  message: string;
  type: "compliance" | "work_order" | "alert" | "emergency";
}

/**
 * Send SMS notification
 */
export async function sendSMS(notification: SMSNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!client) {
      return { success: false, error: "Twilio client not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables." };
    }
    
    const message = await client.messages.create({
      body: notification.message,
      from: TWILIO_PHONE_NUMBER!,
      to: notification.to,
    });

    console.log(`[Twilio SMS] Sent to ${notification.to}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error("[Twilio SMS] Failed to send:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send voice call notification
 */
export async function sendVoiceCall(notification: VoiceNotification): Promise<{ success: boolean; callId?: string; error?: string }> {
  try {
    if (!client) {
      return { success: false, error: "Twilio client not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables." };
    }
    
    const call = await client.calls.create({
      url: `https://demo.twilio.com/docs/voice.xml?Message=${encodeURIComponent(notification.message)}`,
      to: notification.to,
      from: TWILIO_PHONE_NUMBER!,
    });

    console.log(`[Twilio Voice] Call initiated to ${notification.to}: ${call.sid}`);
    return { success: true, callId: call.sid };
  } catch (error: any) {
    console.error("[Twilio Voice] Failed to initiate call:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send compliance deadline reminder via SMS
 */
export async function sendComplianceDeadlineReminder(phoneNumber: string, taskName: string, daysUntilDue: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green Compliance: Reminder - "${taskName}" is due in ${daysUntilDue} days. Please complete this task to maintain compliance.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "compliance",
  });
}

/**
 * Send work order assignment notification via SMS
 */
export async function sendWorkOrderAssignment(phoneNumber: string, workOrderId: string, propertyName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green: You have been assigned a work order at ${propertyName}. Work Order ID: ${workOrderId}. Check your app for details.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "work_order",
  });
}

/**
 * Send violation alert via SMS
 */
export async function sendViolationAlert(phoneNumber: string, violationType: string, severity: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green Alert: ${severity.toUpperCase()} - ${violationType} violation detected. Immediate action may be required. Check your dashboard.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "alert",
  });
}

/**
 * Send emergency alert via voice call
 */
export async function sendEmergencyAlert(phoneNumber: string, alertMessage: string): Promise<{ success: boolean; callId?: string; error?: string }> {
  return sendVoiceCall({
    to: phoneNumber,
    message: alertMessage,
    type: "emergency",
  });
}

/**
 * Send geofence breach alert
 */
export async function sendGeofenceBreachAlert(phoneNumber: string, deviceName: string, location: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green Alert: Device "${deviceName}" has left the designated area at ${location}. Please verify.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "alert",
  });
}

/**
 * Send device offline alert
 */
export async function sendDeviceOfflineAlert(phoneNumber: string, deviceName: string, lastSeenTime: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green Alert: Device "${deviceName}" is offline. Last seen: ${lastSeenTime}. Please check device status.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "alert",
  });
}

/**
 * Send subscription renewal reminder
 */
export async function sendSubscriptionRenewalReminder(phoneNumber: string, daysUntilRenewal: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green: Your subscription renews in ${daysUntilRenewal} days. Ensure payment method is up to date to avoid service interruption.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "alert",
  });
}

/**
 * Verify phone number with OTP
 */
export async function sendPhoneVerificationOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `FL Green Verification: Your one-time code is ${otp}. This code expires in 10 minutes. Do not share this code.`;
  return sendSMS({
    to: phoneNumber,
    message,
    type: "alert",
  });
}
