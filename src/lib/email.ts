import { env } from "@/env";
import nodemailer from "nodemailer";
import type { ReactElement } from "react";
import { render } from "react-email";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_SERVER_HOST,
  port: parseInt(env.EMAIL_SERVER_PORT),
  auth: env.EMAIL_SERVER_USER ? { user: env.EMAIL_SERVER_USER, pass: env.EMAIL_SERVER_PASSWORD } : undefined,
});

export async function sendEmail({ to, subject, react }: { to: string; subject: string; react: ReactElement }) {
  const html = await render(react);
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
}
