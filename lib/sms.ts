import { getSettings } from "@/models/settings.model";

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const settings = await getSettings();
  if (!settings.sms?.enabled) {
    console.log("SMS is disabled. Not sending message:", message);
    return false;
  }

  const provider = settings.sms.provider || "twilio";

  try {
    return await testSmsConnection(to, message, provider, settings.sms);
  } catch (error) {
    return false;
  }
}

export async function testSmsConnection(
  to: string,
  message: string,
  provider: string,
  sms: any
): Promise<boolean> {
  try {
    if (provider === "twilio") {
      const accountSid = sms.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = sms.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
      const from = sms.twilioFromNumber || process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !from) throw new Error("Twilio credentials missing");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
              "base64",
            )}`,
          },
          body: new URLSearchParams({
            To: to,
            From: from,
            Body: message,
          }),
        },
      );

      if (!response.ok) throw new Error(await response.text());
      return true;
    }

    if (provider === "hubtel") {
      const clientId = sms.hubtelClientId || process.env.HUBTEL_CLIENT_ID;
      const clientSecret = sms.hubtelClientSecret || process.env.HUBTEL_CLIENT_SECRET;
      const senderId = sms.hubtelSenderId || process.env.HUBTEL_SENDER_ID;

      if (!clientId || !clientSecret || !senderId) throw new Error("Hubtel credentials missing");

      const response = await fetch(`https://smsc.hubtel.com/v1/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
            "base64",
          )}`,
        },
        body: JSON.stringify({
          From: senderId,
          To: to,
          Content: message,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      return true;
    }

    if (provider === "arkesel") {
      const apiKey = sms.arkeselApiKey || process.env.ARKESEL_API_KEY;
      const senderId = sms.arkeselSenderId || process.env.ARKESEL_SENDER_ID;

      if (!apiKey || !senderId) throw new Error("Arkesel credentials missing");

      const response = await fetch(`https://sms.arkesel.com/api/v2/sms/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: senderId,
          message: message,
          recipients: [to],
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      return true;
    }

    if (provider === "messagebird") {
      const accessKey = sms.messagebirdAccessKey || process.env.MESSAGEBIRD_ACCESS_KEY;
      const originator = sms.messagebirdOriginator || process.env.MESSAGEBIRD_ORIGINATOR;

      if (!accessKey || !originator) throw new Error("MessageBird credentials missing");

      const response = await fetch(`https://rest.messagebird.com/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `AccessKey ${accessKey}`,
        },
        body: JSON.stringify({
          originator: originator,
          recipients: [to],
          body: message,
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      return true;
    }
  } catch (error) {
    console.error(`SMS send failed (${provider}):`, error);
    throw error;
  }

  return false;
}
