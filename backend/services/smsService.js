const axios = require('axios');

const sendSMS = async (phoneNumber, message) => {
  try {
    // format phone number with country code
    let mobile = phoneNumber.toString().replace(/\D/g, '');
    if (!mobile.startsWith('91') && mobile.length === 10) {
      mobile = `91${mobile}`;
    }

    const response = await axios.post(
      'https://www.circuitdigest.cloud/api/v1/send_sms',
      {
        mobiles: mobile,
        var1: message,
        var2: 'Sportfolio',
      },
      {
        params: { ID: process.env.CIRCUIT_DIGEST_TEMPLATE_ID || '105' },
        headers: {
          'Authorization': process.env.CIRCUIT_DIGEST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ SMS sent to ${mobile}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ SMS failed to ${phoneNumber}:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

const sendBulkSMS = async (phoneNumbers, message) => {
  const results = await Promise.allSettled(
    phoneNumbers.map((phone) => sendSMS(phone, message))
  );

  const sent   = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - sent;

  console.log(`📊 Bulk SMS: ${sent} sent, ${failed} failed`);
  return { sent, failed, total: results.length };
};

module.exports = { sendSMS, sendBulkSMS };