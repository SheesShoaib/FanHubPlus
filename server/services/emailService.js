const nodemailer = require("nodemailer");

let transporter = null;

function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter && isEmailConfigured()) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const mailer = getTransporter();

  if (!mailer) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n${text}\n`);
    } else {
      console.warn("Email not sent because SMTP is not configured.");
    }
    return { sent: false };
  }

  await mailer.sendMail({
    from: process.env.MAIL_FROM || `FanHub+ <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}

function sendPasswordResetEmail(user, link) {
  return sendEmail({
    to: user.email,
    subject: "Reset your FanHub+ password",
    text: `Hi ${user.name},\n\nUse the link below to reset your password. It expires in 30 minutes.\n\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Hi ${user.name},</p><p>Use the link below to reset your password. It expires in 30 minutes.</p><p><a href="${link}">Reset my password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}

function sendPasswordResetOTPEmail(user, otp) {
  return sendEmail({
    to: user.email,
    subject: "Your FanHub+ Password Reset Code",
    text: `Hi ${user.name},\n\nYour password reset code is:\n\n${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#7c3aed;">FanHub+ Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f3f0ff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#7c3aed;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#666;font-size:13px;">Do not share this code with anyone. If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
}

function sendVerificationEmail(user, link) {
  return sendEmail({
    to: user.email,
    subject: "Verify your FanHub+ email",
    text: `Welcome to FanHub+, ${user.name}!\n\nConfirm your email address with this link (valid for 24 hours):\n\n${link}`,
    html: `<p>Welcome to FanHub+, ${user.name}!</p><p>Confirm your email address with this link (valid for 24 hours):</p><p><a href="${link}">Verify my email</a></p>`,
  });
}

module.exports = { sendEmail, sendPasswordResetEmail, sendPasswordResetOTPEmail, sendVerificationEmail, isEmailConfigured };
