import "dotenv/config";
import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

/** Returns a cached Ethereal SMTP transporter, creating one on first call. */
export async function getMailer(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  // Create a fresh Ethereal test account on startup
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

  return _transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Sends one email and returns the Ethereal preview URL. */
export async function sendEmail(opts: SendEmailOptions): Promise<string> {
  const mailer = await getMailer();
  const info = await mailer.sendMail({
    from: '"ReachInbox" <noreply@reachinbox.dev>',
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<p>${opts.text.replace(/\n/g, "<br>")}</p>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || "";
  console.log(`✅  Email sent to ${opts.to} — preview: ${previewUrl}`);
  return previewUrl;
}
