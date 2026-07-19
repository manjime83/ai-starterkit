import { env } from "@/lib/env";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import type { ReactElement } from "react";
import { render } from "react-email";

const ses = new SESv2Client({
  region: env.SES_REGION,
  credentials: {
    accessKeyId: env.SES_ACCESS_KEY_ID,
    secretAccessKey: env.SES_SECRET_ACCESS_KEY,
  },
});

export async function sendEmail({ to, subject, react }: { to: string; subject: string; react: ReactElement }) {
  const html = await render(react);

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: env.EMAIL_FROM,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
      },
    }),
  );
}
