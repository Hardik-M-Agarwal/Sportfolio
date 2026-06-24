const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsApp = async (to, message) => {
  // format phone number
  let phone = to.toString().replace(/\D/g, "");
  if (!phone.startsWith("91") && phone.length === 10) {
    phone = "91" + phone;
  }
  const formattedTo = `whatsapp:+${phone}`;

  try {
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formattedTo,
      body: message,
    });
    return { success: true, sid: result.sid, to: formattedTo };
  } catch (error) {
    console.error(`Failed to send WhatsApp to ${formattedTo}:`, error.message);
    return { success: false, error: error.message, to: formattedTo };
  }
};

const broadcastToPhones = async (phones, message) => {
  const results = await Promise.allSettled(
    phones.map((phone) => sendWhatsApp(phone, message))
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - sent;

  return { sent, failed, total: results.length };
};

module.exports = { sendWhatsApp, broadcastToPhones };