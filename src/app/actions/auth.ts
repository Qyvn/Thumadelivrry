"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@/lib/constants";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(8).max(100),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "Incorrect email or password." };
  }
  if (!user.isActive) {
    return { ok: false, error: "This account is suspended." };
  }

  await createSession(user.id);
  await writeAudit({
    actorId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "LOGIN",
  });

  if (user.role === Role.ADMIN || user.role === Role.SUPPORT) redirect("/admin");
  if (user.role === Role.MERCHANT_STAFF) redirect("/merchant");
  if (user.role === Role.COURIER) redirect("/courier");
  redirect("/");
}

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check your details. Password must be at least 8 characters.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      role: Role.CUSTOMER,
      customerProfile: { create: {} },
    },
  });

  await createSession(user.id);
  await writeAudit({
    actorId: user.id,
    entityType: "USER",
    entityId: user.id,
    action: "REGISTER",
  });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
