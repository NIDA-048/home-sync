"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Home,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

type HouseholdData = {
  id: string;
  name: string;
  invitationCode: string;
  role: "OWNER" | "MEMBER";
};

type CurrentHouseholdResponse = {
  success: boolean;
  hasHousehold?: boolean;
  message?: string;
  household?: HouseholdData | null;
};

type HouseholdActionResponse = {
  success: boolean;
  message?: string;
  household?: HouseholdData;
};

export default function HouseholdPage() {
  const router = useRouter();

  const [householdName, setHouseholdName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkExistingHousehold();
  }, []);

  const checkExistingHousehold = async () => {
    try {
      const response = await fetch(
        "/api/auth/household/current",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data: CurrentHouseholdResponse =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        setLoading(false);
        return;
      }

      if (
        data.success &&
        data.hasHousehold &&
        data.household
      ) {
        localStorage.setItem(
          "homesync-household",
          JSON.stringify(data.household),
        );

        router.replace("/dashboard");
        return;
      }
    } catch (error) {
      console.error(
        "CHECK_HOUSEHOLD_ERROR:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setCreateError("");
    setJoinError("");
    setSuccessMessage("");

    const trimmedName = householdName.trim();

    if (trimmedName.length < 2) {
      setCreateError(
        "Household name must be at least 2 characters long.",
      );
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch(
        "/api/auth/household/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: trimmedName,
          }),
        },
      );

      const data: HouseholdActionResponse =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        setCreateError(
          data.message ||
            "Unable to create household.",
        );
        return;
      }

      if (!data.success || !data.household) {
        setCreateError(
          data.message ||
            "Unable to create household.",
        );
        return;
      }

      localStorage.setItem(
        "homesync-household",
        JSON.stringify(data.household),
      );

      setSuccessMessage(
        "Household created successfully! Redirecting...",
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (error) {
      console.error(
        "CREATE_HOUSEHOLD_ERROR:",
        error,
      );

      setCreateError(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinHousehold = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setJoinError("");
    setCreateError("");
    setSuccessMessage("");

    const trimmedCode =
      invitationCode.trim().toUpperCase();

    if (!trimmedCode) {
      setJoinError(
        "Please enter an invitation code.",
      );
      return;
    }

    setJoinLoading(true);

    try {
      const response = await fetch(
        "/api/auth/household/join",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            invitationCode: trimmedCode,
          }),
        },
      );

      const data: HouseholdActionResponse =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        setJoinError(
          data.message ||
            "Unable to join household.",
        );
        return;
      }

      if (!data.success || !data.household) {
        setJoinError(
          data.message ||
            "Unable to join household.",
        );
        return;
      }

      localStorage.setItem(
        "homesync-household",
        JSON.stringify(data.household),
      );

      setSuccessMessage(
        "You joined the household successfully! Redirecting...",
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (error) {
      console.error(
        "JOIN_HOUSEHOLD_ERROR:",
        error,
      );

      setJoinError(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error(
        "LOGOUT_ERROR:",
        error,
      );
    } finally {
      localStorage.removeItem("homesync-user");
      localStorage.removeItem("homesync-household");

      router.replace("/login");
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "COPY_CODE_ERROR:",
        error,
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-full border-4 border-[#E2E8F0] border-t-[#3B82F6] animate-spin" />

          <p className="text-sm font-medium text-[#64748B]">
            Checking your household...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      {/* Header */}
      <header className="h-20 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 md:px-10">
        <button
          type="button"
          onClick={() => router.push("/landing")}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#172033] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Home
              size={21}
              strokeWidth={2.2}
              className="text-white"
            />
          </div>

          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight">
              HomeSync
            </h1>

            <p className="text-xs text-[#64748B]">
              Smart household management
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] transition"
        >
          <LogOut size={17} />
          Logout
        </button>
      </header>

      {/* Main */}
      <section className="min-h-[calc(100vh-80px)] px-5 py-10 md:px-8 md:py-14">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] mb-5">
              <Home size={27} />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Set up your household
            </h2>

            <p className="mt-3 text-[#64748B] leading-7">
              Create a new household or join an existing
              one using an invitation code.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="max-w-3xl mx-auto mb-6 flex items-center gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#166534]">
              <CheckCircle2 size={19} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Household */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-7 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center mb-5">
                <Home size={23} />
              </div>

              <h3 className="text-xl font-bold">
                Create a household
              </h3>

              <p className="mt-2 text-sm text-[#64748B] leading-6">
                Start your own household and invite your
                family members or roommates.
              </p>

              <form
                onSubmit={handleCreateHousehold}
                className="mt-7"
              >
                <label
                  htmlFor="householdName"
                  className="block text-sm font-semibold text-[#172033] mb-2"
                >
                  Household name
                </label>

                <input
                  id="householdName"
                  type="text"
                  value={householdName}
                  onChange={(event) =>
                    setHouseholdName(event.target.value)
                  }
                  placeholder="e.g. Khan Family"
                  disabled={createLoading}
                  className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#172033] outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-[#EFF6FF] disabled:bg-[#F8FAFC]"
                />

                {createError && (
                  <p className="mt-2 text-sm text-red-600">
                    {createError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="mt-5 w-full h-12 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#2563EB] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create household
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Join Household */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-7 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center mb-5">
                <Users size={23} />
              </div>

              <h3 className="text-xl font-bold">
                Join a household
              </h3>

              <p className="mt-2 text-sm text-[#64748B] leading-6">
                Have an invitation code? Enter it below
                to join your family or shared household.
              </p>

              <form
                onSubmit={handleJoinHousehold}
                className="mt-7"
              >
                <label
                  htmlFor="invitationCode"
                  className="block text-sm font-semibold text-[#172033] mb-2"
                >
                  Invitation code
                </label>

                <input
                  id="invitationCode"
                  type="text"
                  value={invitationCode}
                  onChange={(event) =>
                    setInvitationCode(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. HS-A1B2C3D4"
                  disabled={joinLoading}
                  className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium tracking-wide text-[#172033] uppercase outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-[#EFF6FF] disabled:bg-[#F8FAFC]"
                />

                {joinError && (
                  <p className="mt-2 text-sm text-red-600">
                    {joinError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={joinLoading}
                  className="mt-5 w-full h-12 rounded-xl border border-[#3B82F6] text-[#3B82F6] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#EFF6FF] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {joinLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#93C5FD] border-t-[#3B82F6] animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join household
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <ShieldCheck
                size={21}
                className="text-[#3B82F6] mb-3"
              />

              <h4 className="font-semibold text-sm">
                Private & secure
              </h4>

              <p className="mt-1.5 text-xs text-[#64748B] leading-5">
                Your household data stays connected to
                your authenticated account.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <Users
                size={21}
                className="text-[#3B82F6] mb-3"
              />

              <h4 className="font-semibold text-sm">
                Add your members
              </h4>

              <p className="mt-1.5 text-xs text-[#64748B] leading-5">
                Invite family members or roommates after
                setting up your household.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <CheckCircle2
                size={21}
                className="text-[#3B82F6] mb-3"
              />

              <h4 className="font-semibold text-sm">
                Stay organized
              </h4>

              <p className="mt-1.5 text-xs text-[#64748B] leading-5">
                Manage tasks, assignments, completion and
                household activity in one place.
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-xs text-[#94A3B8]">
              You can manage your household members and
              tasks from the dashboard after setup.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}