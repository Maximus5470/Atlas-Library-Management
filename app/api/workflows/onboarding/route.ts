import { serve } from "@upstash/workflow/nextjs";
import { users } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import emailjs from "@emailjs/browser";

type UserState = "non-active" | "active";

type InitialData = {
  email: string;
  fullName: string;
};

const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;
const THREE_DAYS_IN_MS = 3 * ONE_DAY_IN_MS;
const ONE_MONTH_IN_MS = 30 * ONE_DAY_IN_MS;

const sendEmail = async (
  subject: string,
  email: string,
  name: string,
  message: string,
) => {
  await emailjs.send(
    process.env.EMAILJS_SERVICE_ID!,
    process.env.EMAILJS_TEMPLATE_ID!,
    {
      subject,
      to_email: email,
      from_name: name,
      message,
    },
    process.env.EMAILJS_PUBLIC_KEY!,
  );
};

const getUserState = async (email: string): Promise<UserState> => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    return "non-active";
  }

  const lastActivityDate = new Date(user[0].lastActivityDate!);
  const now = new Date();
  const time_difference = now.getTime() - lastActivityDate.getTime();

  if (time_difference < ONE_MONTH_IN_MS && time_difference > THREE_DAYS_IN_MS) {
    return "non-active";
  }
  return "active";
};

export const { POST } = serve<InitialData>(async (context) => {
  const { email, fullName } = context.requestPayload;

  await context.run("new-signup", async () => {
    await sendEmail(
      "New Account Created",
      email,
      fullName,
      "Welcome to our service!",
    );
  });

  await context.sleep("wait-for-3-days", 60 * 60 * 24 * 3);

  while (true) {
    const state = await context.run("check-user-state", async () => {
      return await getUserState(email);
    });

    if (state === "non-active") {
      await context.run("send-email-non-active", async () => {
        await sendEmail(
          "We miss you!",
          email,
          fullName,
          "Come back to our library!",
        );
      });
    } else if (state === "active") {
      await context.run("send-email-active", async () => {
        await sendEmail(
          "Welcome back!",
          email,
          fullName,
          "We truly missed you!",
        );
      });
    }

    await context.sleep("wait-for-1-month", 60 * 60 * 24 * 30);
  }
});
