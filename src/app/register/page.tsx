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
  User,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check password confirmation before sending data.
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create your account.");
        return;
      }

      setSuccess("Account created successfully! Redirecting to login...");

      // Give the user a moment to see the success message.
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("REGISTER_REQUEST_ERROR:", error);

      setError(
        "Unable to connect to the server. Please make sure your development server is running."
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
                Built for shared homes
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Create a home where{" "}
                <span className="text-[#60A5FA]">everyone shares</span> the
                work.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                HomeSync helps families and roommates organize household
                responsibilities, distribute tasks fairly, and keep everyone
                on the same page.
              </p>

              <div className="mt-9 space-y-4">
                {[
                  "Automatically distribute household tasks",
                  "Track progress and completion",
                  "Keep responsibilities fair and transparent",
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
                Get started
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Join HomeSync and start managing your household together.
              </p>
            </div>

            {/* FORM CARD */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
              <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="space-y-5"
              >
                {/* NAME */}
                <div>
                  <label
                    htmlFor="register-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />

                    <input
                      id="register-name"
                      name="register_name"
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="off"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="register-email"
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
                      id="register-email"
                      name="register_email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="off"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />

                    <input
                      id="register-password"
                      name="register_password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#172033]"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-[#94A3B8]">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label
                    htmlFor="register-confirm-password"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />

                    <input
                      id="register-confirm-password"
                      name="register_confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#172033]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
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

                {/* TERMS */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="register-terms"
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 accent-[#3B82F6]"
                  />

                  <label
                    htmlFor="register-terms"
                    className="text-xs leading-5 text-[#64748B]"
                  >
                    I agree to the HomeSync{" "}
                    <Link
                      href="#"
                      className="font-semibold text-[#3B82F6] hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="font-semibold text-[#3B82F6] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:bg-[#2563EB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* LOGIN */}
              <div className="mt-6 border-t border-[#E2E8F0] pt-6 text-center">
                <p className="text-sm text-[#64748B]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[#3B82F6] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/landing"
                className="text-sm font-medium text-[#64748B] hover:text-[#3B82F6]"
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