"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null,
  );

  return (
    <div className="thuma-hero-bg flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-rise rounded-2xl border border-[#0E3B24]/8 bg-white/90 p-6 shadow-sm sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
          Duban
        </p>
        <h1 className="mt-2 text-xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-[#0E3B24]/65">
          Love Durban, Hidden Gems · Delivery powered by THUMA
        </p>

        <form action={formAction} className="mt-6 space-y-4">
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
              autoComplete="email"
            />
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
              className="mt-1.5"
              autoComplete="current-password"
            />
          </div>
          {state && !state.ok && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-[#0E3B24]/65">
          New here?{" "}
          <Link href="/register" className="font-semibold text-[#0E3B24] underline">
            Create an account
          </Link>
        </p>

        <div className="mt-6 rounded-xl bg-[#F7F3EA] p-3 text-xs text-[#0E3B24]/70">
          <p className="font-semibold">Demo accounts</p>
          <p className="mt-1">Password: thuma-demo-2026</p>
          <p>customer@thuma.local · merchant@thuma.local</p>
          <p>courier@thuma.local · admin@thuma.local</p>
        </div>
      </div>
    </div>
  );
}
