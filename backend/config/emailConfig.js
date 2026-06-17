const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"Sportfolio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your Sportfolio account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f7f6f2; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 900; color: #0d0d0d; letter-spacing: -1px; margin: 0;">
            Sport<span style="color: #1a6bff;">folio</span>
          </h1>
        </div>
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e0d8;">
          <h2 style="font-size: 20px; font-weight: 800; color: #0d0d0d; margin: 0 0 8px;">
            Hey ${name} 👋
          </h2>
          <p style="color: #6b6b6b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Welcome to Sportfolio! Use the OTP below to verify your account. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #f7f6f2; border: 2px dashed #e2e0d8; border-radius: 12px; padding: 20px 40px;">
              <p style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #1a6bff; margin: 0;">
                ${otp}
              </p>
            </div>
          </div>
          <p style="color: #6b6b6b; font-size: 12px; text-align: center; margin: 0;">
            If you didn't sign up for Sportfolio, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };