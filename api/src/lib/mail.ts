import nodemailer from "nodemailer";
import { formatDate } from "@/lib/format";

export type MailResult = { sent: boolean; error?: string };

export function appBaseUrl(): string {
  return (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailHtml(input: {
  greeting: string;
  headline: string;
  note?: string;
  button: { label: string; url: string; color: string };
}): string {
  const note = input.note
    ? `<p style="margin:16px 0;padding:12px 14px;border:1px solid #ddd;border-radius:6px;white-space:pre-wrap">${escapeHtml(input.note)}</p>`
    : "";
  return [
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:560px">`,
    `<p>${escapeHtml(input.greeting)}</p>`,
    `<p style="font-size:17px"><strong>${escapeHtml(input.headline)}</strong></p>`,
    note,
    `<p><a href="${escapeHtml(input.button.url)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${input.button.color};color:#fff;text-decoration:none;font-weight:bold">${escapeHtml(input.button.label)}</a></p>`,
    `</div>`,
  ].join("");
}

export async function sendTeamAssignedEmail(input: {
  to: string;
  leaderName: string;
  teamName: string;
  eventName: string;
  start: Date;
  end: Date;
  eventPath: string;
}): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) {
    return { sent: false, error: "Email is not configured" };
  }

  const start = formatDate(input.start);
  const end = formatDate(input.end);
  const url = `${appBaseUrl()}${input.eventPath}`;
  const subject = `Your team has been assigned to event ${input.eventName} from ${start} to ${end}`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject,
      text: [
        `Hello ${input.leaderName},`,
        "",
        `Your team ${input.teamName} has been assigned to event ${input.eventName} from ${start} to ${end}.`,
        "",
        "Sign in to assign tasks to your team:",
        url,
      ].join("\n"),
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    console.error("Assignment email failed", message);
    return { sent: false, error: message };
  }
}

export async function sendInquiryDeclinedEmail(input: {
  to: string;
  reporterName: string;
  projectName: string;
  brandName: string;
  reason: string;
  inquiryPath: string;
}): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) {
    return { sent: false, error: "Email is not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    const url = `${appBaseUrl()}${input.inquiryPath}`;
    await transporter.sendMail({
      from,
      to: input.to,
      subject: `The Project ${input.projectName} has been declined`,
      text: [
        `Hello ${input.reporterName},`,
        "",
        `The Project ${input.projectName} has been declined`,
        "",
        input.reason,
        "",
        "Send apology to the client:",
        url,
      ].join("\n"),
      html: emailHtml({
        greeting: `Hello ${input.reporterName},`,
        headline: `The Project ${input.projectName} has been declined`,
        note: input.reason,
        button: { label: "Send apology to the client", url, color: "#d4331f" },
      }),
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    console.error("Inquiry declined email failed", message);
    return { sent: false, error: message };
  }
}

export async function sendProjectAssignedEmail(input: {
  to: string;
  recipientName: string;
  reason: "lead" | "reporter";
  projectName: string;
  projectCode: string;
  brandName: string;
  projectPath: string;
}): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) {
    return { sent: false, error: "Email is not configured" };
  }

  const headline =
    input.reason === "lead"
      ? `You have been assigned as project lead on ${input.projectName} (${input.projectCode}) for ${input.brandName}.`
      : `The Project ${input.projectName} has been approved`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    const url = `${appBaseUrl()}${input.projectPath}`;
    await transporter.sendMail({
      from,
      to: input.to,
      subject:
        input.reason === "lead"
          ? `You are the project lead on ${input.projectName}`
          : `The Project ${input.projectName} has been approved`,
      text: [`Hello ${input.recipientName},`, "", headline, "", "Start project Planning:", url].join("\n"),
      html: emailHtml({
        greeting: `Hello ${input.recipientName},`,
        headline,
        button: { label: "Start project Planning", url, color: "#1a8f52" },
      }),
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    console.error("Project assigned email failed", message);
    return { sent: false, error: message };
  }
}

export async function sendProjectTeamNotificationEmail(input: {
  to: string[];
  projectName: string;
  projectCode: string;
  projectPath: string;
}): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) {
    return { sent: false, error: "Email is not configured" };
  }

  const url = `${appBaseUrl()}${input.projectPath}`;
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from,
      to: from,
      bcc: input.to,
      subject: "A new project on the waaaayyyy!!",
      text: [
        "A new project on the waaaayyyy!!",
        "",
        `${input.projectName} (${input.projectCode})`,
        "",
        "Open the project overview:",
        url,
      ].join("\n"),
      html: emailHtml({
        greeting: "Hello team,",
        headline: "A new project on the waaaayyyy!!",
        note: `${input.projectName} (${input.projectCode})`,
        button: { label: "Open project overview", url, color: "#1a8f52" },
      }),
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    console.error("Project team notification email failed", message);
    return { sent: false, error: message };
  }
}

export async function sendTaskAssignedEmail(input: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  eventName: string;
  dueDate: Date | null;
  taskPath: string;
}): Promise<MailResult> {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) {
    return { sent: false, error: "Email is not configured" };
  }

  const url = `${appBaseUrl()}${input.taskPath}`;
  const lines = [
    `Hello ${input.assigneeName},`,
    "",
    `You have been assigned "${input.taskTitle}" on ${input.eventName}.`,
  ];
  if (input.dueDate) lines.push(`Due ${formatDate(input.dueDate)}.`);
  lines.push("", "Open the task:", url);
  const subject = `You have a task on ${input.eventName}: ${input.taskTitle}`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject,
      text: lines.join("\n"),
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    console.error("Task assignment email failed", message);
    return { sent: false, error: message };
  }
}
