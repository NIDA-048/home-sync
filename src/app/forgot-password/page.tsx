"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Password reset functionality will be connected later.
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      <div className="flex min-h-screen">
        {/* LEFT SIDE */}
        <section className="relative hidden overflow-hidden bg-[#172033] lg:flex lg:w-1/2">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-10 xl:px-20">
            {/* LOGO */}
            <Link
              href="/landing"
              className="flex w-fit items-center gap-3 text-white"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3B82F6]">
                <Home size={23} strokeWidth={2.2} />
              </div>

              <span className="text-2xl font-bold tracking-tight">
                HomeSync
              </span>
            </Link>

            {/* CONTENT */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-300">
                <ShieldCheck size={17} />
                Account security
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Get back into your{" "}
                <span className="text-[#60A5FA]">HomeSync account.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Forgot your password? Enter your email and we&apos;ll help you
                get back to your household workspace.
              </p>

              <div className="mt-9 space-y-4">
                {[
                  "Secure password recovery",
                  "Protect your household account",
                  "Get back to managing your tasks",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                      <CheckCircle2 size={17} />
                    </div>

                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Share the Work. Balance the Home.
            </p>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">
          <div className="w-full max-w-md">
            {/* MOBILE LOGO */}
            <div className="mb-10 flex justify-center lg:hidden">
              <Link
                href="/landing"
                className="flex items-center gap-3 text-[#172033]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
                  <Home size={23} strokeWidth={2.2} />
                </div>

                <span className="text-2xl font-bold">HomeSync</span>
              </Link>
            </div>

            {/* HEADING */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#3B82F6]">
                Password recovery
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                Forgot your password?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                No worries. Enter the email address associated with your
                account.
              </p>
            </div>

            {/* FORM CARD */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
              {!submitted ? (
                <form
                  onSubmit={handleSubmit}
                  autoComplete="off"
                  className="space-y-6"
                >
                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="homesync-reset-email"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                      />

                      <input
                        id="homesync-reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        autoComplete="off"
                        spellCheck={false}
                        required
                        className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    type="submit"
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:bg-[#2563EB] active:scale-[0.99]"
                  >
                    Send Reset Link

                    <ArrowRight
                      size={18}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </button>
                </form>
              ) : (
                /* SUCCESS */
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#3B82F6]">
                    <Mail size={28} />
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    Check your email
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#64748B]">
                    If an account exists for{" "}
                    <span className="font-semibold text-[#172033]">
                      {email}
                    </span>
                    , you&apos;ll receive instructions to reset your password.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-sm font-semibold text-[#3B82F6] hover:underline"
                  >
                    Try another email
                  </button>
                </div>
              )}

              {/* LOGIN */}
              <div className="mt-7 border-t border-[#E2E8F0] pt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#3B82F6] hover:text-[#2563EB]"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            </div>

            {/* HOME */}
            <div className="mt-6 text-center">
              <Link
                href="/landing"
                className="text-sm font-medium text-[#64748B] transition hover:text-[#3B82F6]"
              >
                ← Back to HomeSync
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}