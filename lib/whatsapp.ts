import { ISettings } from "@/models/settings.model";

export function formatPhoneNumber(phone: string): string {
  // Strip all non-digits except a leading +
  let cleaned = phone.replace(/[^\d+]/g, "");
  // If it doesn't start with +, just remove all non-digits
  if (!cleaned.startsWith("+")) {
    cleaned = cleaned.replace(/\D/g, "");
  } else {
    // Remove all non-digits after the leading +
    cleaned = "+" + cleaned.slice(1).replace(/\D/g, "");
  }
  return cleaned;
}

export async function sendWhatsAppMessage(params: {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  settings: ISettings;
}) {
  const { to, templateName, variables, settings } = params;
  const wa = settings.whatsapp;

  if (!wa || !wa.enabled || !to) return false;

  // Resolve template text
  const rawTemplate = wa.templates[templateName as keyof typeof wa.templates];
  if (!rawTemplate) return false;

  // Replace variables like {{orderNumber}}
  let message = rawTemplate as string;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  try {
    if (wa.provider === "meta") {
      if (!wa.metaPhoneNumberId || !wa.metaAccessToken) return false;
      
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${wa.metaPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${wa.metaAccessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body: message },
          }),
        }
      );
      return response.ok;
    } else if (wa.provider === "twilio") {
      if (!wa.twilioAccountSid || !wa.twilioAuthToken || !wa.twilioPhoneNumber) return false;
      
      const auth = Buffer.from(`${wa.twilioAccountSid}:${wa.twilioAuthToken}`).toString("base64");
      const body = new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${wa.twilioPhoneNumber}`,
        Body: message
      });
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${wa.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
          body: body.toString(),
        }
      );
      return response.ok;
    } else if (wa.provider === "messagebird") {
      if (!wa.messagebirdAccessKey || !wa.messagebirdChannelId) return false;
      
      const response = await fetch(
        `https://conversations.messagebird.com/v1/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `AccessKey ${wa.messagebirdAccessKey}`,
          },
          body: JSON.stringify({
            to,
            channelId: wa.messagebirdChannelId,
            type: "text",
            content: { text: message },
          }),
        }
      );
      return response.ok;
    }
  } catch (error) {
    console.error(`Failed to send WhatsApp message via ${wa.provider}:`, error);
  }
  return false;
}
