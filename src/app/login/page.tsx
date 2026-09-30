"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
} from "lucide-react";

type HouseholdResponse = {
  success: boolean;
  hasHousehold?: boolean;
  message?: string;
  household?: {
    id: string;
    name: string;
    invitationCode: string;
    myRole: "OWNER" | "MEMBER";
  } | null;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // STEP 1: LOGIN
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      // Store basic user information for the current UI.
      // Secure authentication is handled by the HTTP-only cookie.
      if (data.user) {
        localStorage.setItem(
          "homesync-user",
          JSON.stringify(data.user),
        );
      }

      setSuccess("Checking your household...");

      // STEP 2: CHECK WHETHER USER ALREADY BELONGS TO A HOUSEHOLD
      const householdResponse = await fetch(
        "/api/auth/household/current",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const householdData: HouseholdResponse =
        await householdResponse.json();

      // If authentication/session check fails
      if (householdResponse.status === 401) {
        setError(
          householdData.message ||
            "Your session could not be verified. Please login again.",
        );
        setSuccess("");
        return;
      }

      if (!householdResponse.ok) {
        setError(
          householdData.message ||
            "Unable to check your household.",
        );
        setSuccess("");
        return;
      }

      // STEP 3:
      // Existing household member → Dashboard
      if (
        householdData.success &&
        householdData.hasHousehold &&
        householdData.household
      ) {
        localStorage.setItem(
          "homesync-household",
          JSON.stringify(householdData.household),
        );

        setSuccess(
          "Login successful! Opening your dashboard...",
        );

        setTimeout(() => {
          router.push("/dashboard");
        }, 500);

        return;
      }

      // STEP 4:
      // New user / no household → Household setup page
      setSuccess(
        "Login successful! Let's set up your household...",
      );

      setTimeout(() => {
        router.push("/household");
      }, 500);
    } catch (error) {
      console.error("LOGIN_REQUEST_ERROR:", error);

      setError(
        "Unable to connect to the server. Please make sure your development server is running.",
      );
    } finally {
      setLoading(false);
    }
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
                <CheckCircle2 size={16} />
                Welcome back
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Keep your home{" "}
                <span className="text-[#60A5FA]">
                  organized together.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Sign in to manage household responsibilities,
                check your tasks, track progress, and keep
                everything balanced.
              </p>

              <div className="mt-9 space-y-4">
                {[
                  "See your assigned household tasks",
                  "Track progress and completion",
                  "Stay connected with your household",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                      <CheckCircle2 size={17} />
                    </div>

                    <span className="text-sm text-slate-200">
                      {item}
                    </span>
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

                <span className="text-2xl font-bold">
                  HomeSync
                </span>
              </Link>
            </div>

            {/* HEADING */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#3B82F6]">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                Sign in to your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Access your household and stay on top of your
                responsibilities.
              </p>
            </div>

            {/* FORM CARD */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
              <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="space-y-5"
              >
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="homesync-login-email"
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
                      id="homesync-login-email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="Enter your email"
                      autoComplete="off"
                      spellCheck={false}
                      required
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="homesync-login-password"
                      className="block text-sm font-semibold"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#3B82F6] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />

                    <input
                      id="homesync-login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      required
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#172033]"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME */}
                <div className="flex items-center gap-3">
                  <input
                    id="homesync-remember"
                    type="checkbox"
                    className="h-4 w-4 accent-[#3B82F6]"
                  />

                  <label
                    htmlFor="homesync-remember"
                    className="text-sm text-[#64748B]"
                  >
                    Remember me
                  </label>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {success}
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:bg-[#2563EB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Sign In

                      <ArrowRight
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* REGISTER */}
              <div className="mt-6 border-t border-[#E2E8F0] pt-6 text-center">
                <p className="text-sm text-[#64748B]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#3B82F6] hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            {/* BACK */}
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
