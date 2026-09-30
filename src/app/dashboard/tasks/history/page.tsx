"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquare,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";

type TaskRule = "TEMPORARY" | "RECURRING" | "PERMANENT";

type TaskStatus =
  | "TO_DO"
  | "PENDING"
  | "IN_PROGRESS"
  | "DONE";

type TaskFrequency =
  | "DAILY"
  | "EVERY_2_DAYS"
  | "EVERY_3_DAYS"
  | "WEEKLY"
  | "EVERY_2_WEEKS"
  | "CUSTOM"
  | null;

type AssignmentMode =
  | "ALL"
  | "SELECTED"
  | "PERMANENT";

type Member = {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string | null;
};

type Assignment = {
  id?: string;
  userId: string;
  user?: Member | null;
};

type TaskCompletion = {
  id: string;
  userId: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  timeTakenMinutes?: number | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  rule: TaskRule;
  status: TaskStatus;
  frequency?: TaskFrequency;
  customDays?: string[];
  assignmentMode?: AssignmentMode;
  scheduledDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  recurrenceGroupId?: string | null;
  isActive?: boolean;
  assignments: Assignment[];
  createdBy?: Member | null;
  completions?: TaskCompletion[];
};

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  image?: string;
  profilePicture?: string;
};

type ApiResponse = {
  tasks?: unknown;
  error?: string;
  message?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeMember(value: unknown): Member | null {
  if (!isObject(value)) return null;
  const id = typeof value.id === "string" ? value.id : "";
  if (!id) return null;

  return {
    id,
    name: typeof value.name === "string" ? value.name : "Member",
    email: typeof value.email === "string" ? value.email : undefined,
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : null,
  };
}

function normalizeAssignment(value: unknown): Assignment | null {
  if (!isObject(value)) return null;
  if (typeof value.userId !== "string") return null;

  return {
    id: typeof value.id === "string" ? value.id : undefined,
    userId: value.userId,
    user: normalizeMember(value.user),
  };
}

function normalizeTask(value: unknown): Task | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string") return null;

  const rule: TaskRule =
    value.rule === "RECURRING" || value.rule === "PERMANENT"
      ? value.rule
      : "TEMPORARY";

  const status: TaskStatus =
    value.status === "PENDING" ||
    value.status === "IN_PROGRESS" ||
    value.status === "DONE"
      ? value.status
      : "TO_DO";

  let frequency: TaskFrequency = null;
  if (
    value.frequency === "DAILY" ||
    value.frequency === "EVERY_2_DAYS" ||
    value.frequency === "EVERY_3_DAYS" ||
    value.frequency === "WEEKLY" ||
    value.frequency === "EVERY_2_WEEKS" ||
    value.frequency === "CUSTOM"
  ) {
    frequency = value.frequency;
  }

  let assignmentMode: AssignmentMode | undefined;
  if (
    value.assignmentMode === "ALL" ||
    value.assignmentMode === "SELECTED" ||
    value.assignmentMode === "PERMANENT"
  ) {
    assignmentMode = value.assignmentMode;
  }

  const rawAssignments = Array.isArray(value.assignments)
    ? value.assignments
    : [];

  const assignments = rawAssignments
    .map(normalizeAssignment)
    .filter((a): a is Assignment => a !== null);

  const customDays = Array.isArray(value.customDays)
    ? value.customDays.filter((day): day is string => typeof day === "string")
    : [];

  return {
    id: value.id,
    title: value.title,
    description: typeof value.description === "string" ? value.description : null,
    rule,
    status,
    frequency,
    customDays,
    assignmentMode,
    scheduledDate:
      typeof value.scheduledDate === "string" ? value.scheduledDate : null,
    dueDate: typeof value.dueDate === "string" ? value.dueDate : null,
    estimatedMinutes:
      typeof value.estimatedMinutes === "number" ? value.estimatedMinutes : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    recurrenceGroupId:
      typeof value.recurrenceGroupId === "string"
        ? value.recurrenceGroupId
        : null,
    isActive: typeof value.isActive === "boolean" ? value.isActive : true,
    assignments,
    createdBy: normalizeMember(value.createdBy),
    completions: Array.isArray(value.completions) ? (value.completions as any) : [],
  };
}

function getTodayString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateString?: string | null): string {
  if (!dateString) return "Not scheduled";
  const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "Not scheduled";
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFrequency(frequency?: TaskFrequency | null): string {
  switch (frequency) {
    case "DAILY":
      return "Daily";
    case "EVERY_2_DAYS":
      return "Every 2 days";
    case "EVERY_3_DAYS":
      return "Every 3 days";
    case "WEEKLY":
      return "Weekly";
    case "EVERY_2_WEEKS":
      return "Every 2 weeks";
    case "CUSTOM":
      return "Custom";
    default:
      return "One time";
  }
}

function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "TO_DO":
      return "To Do";
    case "PENDING":
      return "Pending";
    case "IN_PROGRESS":
      return "In Progress";
    case "DONE":
      return "Done";
    default:
      return "To Do";
  }
}

function statusClasses(status: TaskStatus): string {
  switch (status) {
    case "DONE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

/* =========================================================
   SIDEBAR & LOGO (EXACT DASHBOARD STYLE)
========================================================= */

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
        <Home size={21} strokeWidth={2.2} />
      </div>
      <span className="text-xl font-bold tracking-[-0.03em] text-white">
        HomeSync
      </span>
    </Link>
  );
}

function SidebarLinks({ setMobileOpen }: { setMobileOpen?: (v: boolean) => void }) {
  const links = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: false },
    { title: "Tasks", href: "/dashboard/tasks", icon: ListChecks, active: true },
    { title: "Members", href: "/dashboard/members", icon: Users, active: false },
    { title: "Feedback", href: "/dashboard/feedback", icon: MessageSquare, active: false },
    { title: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, active: false },
    { title: "Settings", href: "/dashboard/settings", icon: Settings, active: false },
  ];

  return (
    <nav className="flex-1 px-4 py-4">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        Workspace
      </p>

      <div className="space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                link.active
                  ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-900/20"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {link.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarContent() {
  return (
    <>
      <div className="px-5 py-5">
        <Logo />
      </div>

      <SidebarLinks />

      <div className="mt-auto border-t border-white/10 p-5">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs font-semibold text-white">
            Keep it balanced
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Share responsibilities and keep your household organized.
          </p>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   MAIN HISTORY PAGE
========================================================= */

export default function TaskHistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [mode, setMode] = useState<"MY" | "HOUSEHOLD">("MY");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [householdRole, setHouseholdRole] = useState<"OWNER" | "MEMBER" | "">("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const currentUserId = currentUser?.id || "";

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("homesync-user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed && (parsed.id || parsed.email || parsed.name)) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "household") {
      setMode("HOUSEHOLD");
    } else if (type === "my") {
      setMode("MY");
    }
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tasks?date=${encodeURIComponent(selectedDate)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to load task history."
        );
      }

      const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];

      const normalizedTasks: Task[] = rawTasks
        .map(normalizeTask)
        .filter((task): task is Task => task !== null);

      const uniqueTasks = Array.from(
        new Map<string, Task>(
          normalizedTasks.map((task): [string, Task] => [task.id, task])
        ).values()
      );

      setTasks(uniqueTasks);
    } catch (err) {
      setTasks([]);
      setError(
        err instanceof Error ? err.message : "Failed to load task history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const deleteTask = async (taskId: string, title?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title || "this task"}"?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to delete task.");
      }

      setTasks((curr) => curr.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to delete task.");
    }
  };

  const relevantTasks = useMemo<Task[]>(() => {
    const selected = tasks.filter((task: Task) => {
      if (!task.scheduledDate) return false;
      const taskDate = String(task.scheduledDate).slice(0, 10);
      return taskDate === selectedDate;
    });

    if (mode === "HOUSEHOLD") {
      return selected;
    }

    if (!currentUserId) {
      return [];
    }

    return selected.filter((task: Task) =>
      task.assignments.some(
        (assignment: Assignment) => assignment.userId === currentUserId
      )
    );
  }, [tasks, selectedDate, mode, currentUserId]);

  const sortedTasks = useMemo<Task[]>(() => {
    return [...relevantTasks].sort((a: Task, b: Task) => {
      const aRecurring = a.rule === "RECURRING";
      const bRecurring = b.rule === "RECURRING";
      if (aRecurring !== bRecurring) {
        return aRecurring ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [relevantTasks]);

  function changeDate(offset: number) {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  }

  function handleDateChange(value: string) {
    if (!value) return;
    setSelectedDate(value);
  }

  const displayName = currentUser?.name || currentUser?.email?.split("@")[0] || "User";
  const profileImage = currentUser?.imageUrl || currentUser?.image || "";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#172033] lg:flex">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#172033]/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#172033] lg:hidden">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarLinks setMobileOpen={setMobileMenuOpen} />
          </aside>
        </>
      )}

      {/* MAIN */}
      <div className="lg:pl-64">
        {/* NAVBAR */}
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-[#E2E8F0] p-2.5 text-[#172033] lg:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="text-sm font-semibold text-[#172033]">Task History</p>
                <p className="hidden text-xs text-[#94A3B8] sm:block">
                  Inspect past and scheduled task activity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/tasks"
                className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Tasks</span>
              </Link>

              {/* USER PROFILE */}
              {currentUser ? (
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-2 py-1.5 transition hover:border-blue-200"
                >
                  {profileImage ? (
                    <img src={profileImage} alt={displayName} className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-sm font-bold text-[#3B82F6]">
                      {userInitial}
                    </div>
                  )}
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {householdRole === "OWNER" ? "Household owner" : "Household member"}
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center rounded-xl bg-[#3B82F6] px-4 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/tasks" className="hover:text-blue-600">
                Tasks
              </Link>
              <span>/</span>
              <span className="text-slate-700 font-semibold">History</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#172033]">
              Task History
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              View tasks for any date and inspect household activity.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("MY")}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "MY"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  My Tasks
                </button>

                <button
                  type="button"
                  onClick={() => setMode("HOUSEHOLD")}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "HOUSEHOLD"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Household Tasks
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeDate(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  title="Previous day"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="h-10 rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => changeDate(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  title="Next day"
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayString())}
                  className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-[#E2E8F0] pt-4 text-sm text-slate-500">
              <CalendarDays size={16} className="text-blue-500" />
              <span>Showing history for</span>
              <span className="font-semibold text-slate-700">
                {formatDate(selectedDate)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white"
                />
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <ListChecks size={32} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">No tasks found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no{" "}
                {mode === "MY" ? "tasks assigned to you" : "household tasks"}{" "}
                for {formatDate(selectedDate)}.
              </p>
              <Link
                href="/dashboard/tasks"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <ListChecks size={16} />
                Go to Tasks
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Tasks</p>
                      <p className="mt-1 text-2xl font-bold text-[#172033]">
                        {sortedTasks.length}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                      <ListChecks size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Completed</p>
                      <p className="mt-1 text-2xl font-bold text-[#172033]">
                        {sortedTasks.filter((t) => t.status === "DONE").length}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Recurring</p>
                      <p className="mt-1 text-2xl font-bold text-[#172033]">
                        {sortedTasks.filter((t) => t.rule === "RECURRING").length}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                      <CalendarDays size={20} className="text-violet-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {sortedTasks.map((task: Task) => {
                  const completion = task.completions?.find((c) => c.timeTakenMinutes != null);
                  const timeTaken = completion?.timeTakenMinutes;

                  return (
                    <div
                      key={task.id}
                      className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                                task.status
                              )}`}
                            >
                              {statusLabel(task.status)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {task.rule === "RECURRING"
                                ? "Recurring"
                                : task.rule === "PERMANENT"
                                ? "Permanent"
                                : "Temporary"}
                            </span>

                            {task.status === "DONE" && timeTaken != null && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 size={12} />
                                Completed in {timeTaken} min
                              </span>
                            )}
                          </div>

                          <h3 className="truncate text-lg font-bold text-[#172033]">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <ListChecks size={20} className="text-blue-600" />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <CalendarDays size={16} />
                            Scheduled
                          </div>
                          <p className="mt-1 text-sm font-bold text-[#172033]">
                            {formatShortDate(task.scheduledDate)}
                          </p>
                        </div>

                        {task.rule === "RECURRING" && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              <CalendarDays size={16} />
                              Frequency
                            </div>
                            <p className="mt-1 text-sm font-bold text-[#172033]">
                              {formatFrequency(task.frequency)}
                            </p>
                          </div>
                        )}

                        {task.estimatedMinutes !== null &&
                          task.estimatedMinutes !== undefined && (
                            <div className="rounded-xl bg-slate-50 p-3">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <Clock3 size={16} />
                                Estimated Time
                              </div>
                              <p className="mt-1 text-sm font-bold text-[#172033]">
                                {task.estimatedMinutes} minutes
                              </p>
                            </div>
                          )}

                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <Users size={16} />
                            Assigned
                          </div>
                          <p className="mt-1 text-sm font-bold text-[#172033]">
                            {task.assignments.length} member
                            {task.assignments.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      {task.assignments.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Assigned Members
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {task.assignments.map((assignment: Assignment) => (
                              <div
                                key={
                                  assignment.id ||
                                  `${task.id}-${assignment.userId}`
                                }
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
                              >
                                {assignment.user?.imageUrl ? (
                                  <img
                                    src={assignment.user.imageUrl}
                                    alt={assignment.user.name || "Member"}
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                    {(assignment.user?.name || "M")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs font-semibold text-slate-700">
                                  {assignment.user?.name || "Member"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                        <span className="text-xs text-blue-700">
                          {task.rule === "RECURRING" ? "Recurring series active" : ""}
                        </span>

                        {Boolean(currentUserId && task.createdBy?.id === currentUserId) && (
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id, task.title)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* FOOTER */}
        <footer className="mt-12 border-y border-[#E2E8F0] bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:px-8 md:flex-row lg:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3B82F6] text-white">
                <Home size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#172033]">HomeSync</p>
                <p className="mt-0.5 text-xs text-[#64748B]">Share the work. Balance the home.</p>
              </div>
            </div>
            <p className="text-xs text-[#64748B]">
              © {new Date().getFullYear()} HomeSync. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}