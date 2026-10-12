"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    registerAction,
    null,
  );

  return (
    <div className="thuma-hero-bg flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-rise rounded-2xl border border-[#18221B]/8 bg-white/90 p-6 sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
          THUMA
        </p>
        <h1 className="mt-2 text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-[#18221B]/65">
          Cornubia Flats customers — register to save addresses and order.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>
            <Input id="fullName" name="fullName" required className="mt-1.5" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <Input id="phone" name="phone" type="tel" className="mt-1.5" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1.5"
            />
          </div>
          {state && !state.ok && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Register"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-[#18221B]/65">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
