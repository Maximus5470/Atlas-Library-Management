"use server";

import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { hash } from "bcryptjs";
import { signIn } from "@/auth";
import { headers } from "next/headers";
import ratelimit from "@/lib/ratelimit";
import { redirect } from "next/navigation";

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;
  const ip = (await headers()).get(`x-forwarded-for`) || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    redirect("/too-many-requests");
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, message: result.error };
    }
    return { success: true, message: "Sign in successful" };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Sign in error" };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { fullName, email, password, universityId, universityCard } = params;

  const ip = (await headers()).get(`x-forwarded-for`) || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    redirect("/too-many-requests");
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser.length > 0) {
    return { success: false, message: "User already exists" };
  }
  const hashedPassword = await hash(password, 12);
  try {
    await db.insert(users).values({
      fullName: fullName,
      email: email,
      universityId: universityId,
      password: hashedPassword,
      universityCard: universityCard,
    });

    await signInWithCredentials({ email, password });

    return {
      success: true,
      message: "User created successfully",
    };
  } catch (e) {
    console.log(e);
    return { success: false, message: "Signup error" };
  }
};
