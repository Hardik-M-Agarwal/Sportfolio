const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (amount, receipt, notes = {}) => {
  const order = await razorpay.orders.create({
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt,
    notes,
  });
  return order;
};

const verifySignature = (orderId, paymentId, signature) => {
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};

module.exports = { createOrder, verifySignature };