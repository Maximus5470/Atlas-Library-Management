import { Client as WorkflowClient } from "@upstash/workflow";
import config from "@/lib/config";
import emailjs from "@emailjs/browser";

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async (
  subject: string,
  email: string,
  name: string,
  message: string,
) => {
  await emailjs.send(
    config.env.emailjs.serviceId,
    config.env.emailjs.templateId,
    {
      subject: subject,
      name: name,
      email: email,
      message: message,
    },
    config.env.emailjs.publicKey,
  );
};
