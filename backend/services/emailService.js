const { transporter } = require("../config/emailConfig");

// ── OTP Email ─────────────────────────────────────────────────────────
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

// ── Pitch Email ───────────────────────────────────────────────────────
const sendPitchEmail = async ({ to, businessName, organiserName, tournament, tier, tierAmount, tierPerks, publicUrl }) => {
  const tierColors = {
    platinum: '#7c3aed',
    gold:     '#d97706',
    silver:   '#6b7280',
    bronze:   '#ea580c',
  };

  const color = tierColors[tier] || '#1a6bff';

  const startDate = new Date(tournament.startDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const endDate = new Date(tournament.endDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const perksHtml = tierPerks.map((perk) => `
    <tr>
      <td style="padding: 6px 0; color: #374151; font-size: 14px;">
        <span style="color: #10b981; font-weight: bold; margin-right: 8px;">✓</span>${perk}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"${organiserName} via Sportfolio" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Sponsorship Opportunity — ${tournament.name}, ${tournament.venue?.city}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f7f6f2; border-radius: 16px;">

        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="font-size: 24px; font-weight: 900; color: #0d0d0d; letter-spacing: -1px; margin: 0 0 4px;">
            Sport<span style="color: #1a6bff;">folio</span>
          </h1>
          <p style="color: #6b6b6b; font-size: 13px; margin: 0;">Sponsorship Opportunity</p>
        </div>

        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e0d8;">

          <h2 style="font-size: 22px; font-weight: 900; color: #0d0d0d; margin: 0 0 6px; letter-spacing: -0.5px;">
            Dear ${businessName},
          </h2>
          <p style="color: #6b6b6b; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
            We're organizing a ${tournament.sport} tournament and would love to have you as a sponsor. Here are the details:
          </p>

          <div style="background: #f7f6f2; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 18px; font-weight: 900; color: #0d0d0d; margin: 0 0 14px; letter-spacing: -0.5px;">
              🏆 ${tournament.name}
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #6b6b6b; font-size: 13px; width: 40%;">Sport</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0d0d0d; text-transform: capitalize;">${tournament.sport}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b6b6b; font-size: 13px;">Format</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0d0d0d; text-transform: capitalize;">${tournament.format}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b6b6b; font-size: 13px;">Venue</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0d0d0d;">${tournament.venue?.name}, ${tournament.venue?.city}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b6b6b; font-size: 13px;">Dates</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0d0d0d;">${startDate} → ${endDate}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b6b6b; font-size: 13px;">Max Teams</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0d0d0d;">${tournament.maxTeams} teams · ${tournament.sportConfig?.teamSize || '—'} players each</td></tr>
            </table>
          </div>

          <div style="border: 2px solid ${color}; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <span style="background: ${color}; color: white; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px;">${tier} Tier</span>
              <span style="font-size: 24px; font-weight: 900; color: ${color};">₹${tierAmount.toLocaleString('en-IN')}</span>
            </div>
            <p style="font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 10px;">What you get:</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${perksHtml}
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${publicUrl}"
               style="display: inline-block; background: #1a6bff; color: white; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; text-decoration: none; letter-spacing: -0.3px;">
              👉 View Tournament & Sponsor Now
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Click the button above to view the tournament page and complete your sponsorship online via Razorpay.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Sent by <strong>${organiserName}</strong> via Sportfolio ·
            <a href="${publicUrl}" style="color: #1a6bff;">View Tournament</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendPitchEmail };