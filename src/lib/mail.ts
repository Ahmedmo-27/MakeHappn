import "server-only";
import nodemailer from "nodemailer";
import { formatDate } from "@/lib/format";

export type MailResult = { sent: boolean; error?: string };

export function appBaseUrl(): string {
  return (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
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
