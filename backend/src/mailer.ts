import "dotenv/config";
import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

/**
 * Returns a cached SMTP transporter.
 * - If SMTP_USER + SMTP_PASS are set in .env, uses those (Gmail / any real SMTP).
 * - Otherwise falls back to a fresh Ethereal test account (preview only, no real delivery).
 */
export async function getMailer(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10);

  if (smtpUser && smtpPass) {
    // ✅ Real SMTP — emails will actually be delivered
    console.log(`📧  SMTP mailer: ${smtpUser} via ${smtpHost}:${smtpPort}`);
    _transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for port 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // ⚠️  Ethereal fallback — emails are NOT delivered, only preview URLs
    console.warn(
      "⚠️   No SMTP_USER/SMTP_PASS set — using Ethereal (emails will NOT be delivered to real inboxes)"
    );
    const testAccount = await nodemailer.createTestAccount();
    console.log("📧  Ethereal test account:", testAccount.user);
    console.log("📬  Preview emails at: https://ethereal.email");

    _transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return _transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Sends one email and returns the preview URL (Ethereal) or empty string (real SMTP). */
export async function sendEmail(opts: SendEmailOptions): Promise<string> {
  const mailer = await getMailer();
  const fromName = process.env.SMTP_FROM_NAME ?? "ReachInbox";
  const fromAddr = process.env.SMTP_USER ?? "noreply@reachinbox.dev";

  const info = await mailer.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<p>${opts.text.replace(/\n/g, "<br>")}</p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || "";
  if (previewUrl) {
    console.log(`✅  Email sent to ${opts.to} — preview: ${previewUrl}`);
  } else {
    console.log(`✅  Email sent to ${opts.to}`);
  }
  return previewUrl;
}
