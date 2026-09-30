"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE";
type TaskRule = "TEMPORARY" | "RECURRING" | "PERMANENT";
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type AssignmentMode = "ALL" | "SELECTED" | "PERMANENT";

type Member = {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string | null;
};

type TaskAssignment = {
  id?: string;
  assignedAt?: string;
  user?: Member;
};

type TaskCompletion = {
  id: string;
  userId: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  timeTakenMinutes?: number | null;
};

type TaskEvidence = {
  id: string;
  userId: string;
  fileUrl: string;
  fileName?: string | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  rule: TaskRule;
  assignmentMode?: AssignmentMode;
  difficulty: Difficulty;
  frequency?: string | null;
  customDays?: string[];
  scheduledDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: Member;
  assignments?: TaskAssignment[];
  completions?: TaskCompletion[];
  evidence?: TaskEvidence[];
};

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  image?: string;
  profilePicture?: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedTaskId?: string | null;
  relatedFeedbackId?: string | null;
};

/* =========================================================
   DATE & TIMER HELPERS
========================================================= */

function getTodayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKey(value: string | null | undefined) {
  if (!value) return "";

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const match = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match?.[1]) {
    return match[1];
  }

  const date = new Date(stringValue);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string | null | undefined) {
  const key = getDateKey(value);

  if (!key) return "Not scheduled";

  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getElapsedMinutes(startedAtStr?: string | null): number {
  if (!startedAtStr) return 0;

  const started = new Date(startedAtStr);

  if (isNaN(started.getTime())) return 0;

  const diffMs = Date.now() - started.getTime();

  return Math.max(1, Math.floor(diffMs / 60000));
}

/* =========================================================
   NORMALIZATION
========================================================= */

function formatRule(rule: TaskRule) {
  switch (rule) {
    case "RECURRING":
      return "Recurring";
    case "PERMANENT":
      return "Permanent";
    case "TEMPORARY":
    default:
      return "Temporary";
  }
}

function formatFrequency(value?: string | null) {
  if (!value) return "Not specified";

  switch (value) {
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
      return value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function normalizeMember(rawMember: any): Member | null {
  if (!rawMember) return null;

  return {
    id: rawMember?.id || rawMember?.userId || "",
    name: rawMember?.name || rawMember?.user?.name || "Member",
    email: rawMember?.email || rawMember?.user?.email || "",
    imageUrl:
      rawMember?.imageUrl ??
      rawMember?.image ??
      rawMember?.user?.imageUrl ??
      null,
  };
}

function normalizeTask(rawTask: any): Task {
  const assignments = Array.isArray(rawTask?.assignments)
    ? rawTask.assignments
    : [];

  const normalizedStatus: TaskStatus =
    rawTask?.status === "PENDING"
      ? "TO_DO"
      : rawTask?.status === "IN_PROGRESS"
        ? "IN_PROGRESS"
        : rawTask?.status === "DONE"
          ? "DONE"
          : "TO_DO";

  return {
    id: String(rawTask?.id || ""),
    title: rawTask?.title || "",
    description: rawTask?.description || "",
    rule:
      rawTask?.rule === "RECURRING"
        ? "RECURRING"
        : rawTask?.rule === "PERMANENT"
          ? "PERMANENT"
          : "TEMPORARY",
    assignmentMode:
      rawTask?.assignmentMode === "ALL"
        ? "ALL"
        : rawTask?.assignmentMode === "PERMANENT"
          ? "PERMANENT"
          : "SELECTED",
    difficulty:
      rawTask?.difficulty === "EASY"
        ? "EASY"
        : rawTask?.difficulty === "HARD"
          ? "HARD"
          : "MEDIUM",
    frequency: rawTask?.frequency || null,
    customDays: Array.isArray(rawTask?.customDays)
      ? rawTask.customDays
      : [],
    scheduledDate: getDateKey(rawTask?.scheduledDate) || null,
    dueDate: getDateKey(rawTask?.dueDate) || null,
    estimatedMinutes: Number(rawTask?.estimatedMinutes) || null,
    status: normalizedStatus,
    createdAt: rawTask?.createdAt || "",
    updatedAt: rawTask?.updatedAt || "",
    createdBy: normalizeMember(rawTask?.createdBy) || undefined,
    assignments: assignments.map((assignment: any) => ({
      id: assignment?.id,
      assignedAt: assignment?.assignedAt,
      user: normalizeMember(assignment?.user) || undefined,
    })),
    completions: Array.isArray(rawTask?.completions)
      ? rawTask.completions
      : [],
    evidence: Array.isArray(rawTask?.evidence)
      ? rawTask.evidence
      : [],
  };
}

function extractMembers(data: any): Member[] {
  const rawMembers = Array.isArray(data?.members)
    ? data.members
    : Array.isArray(data?.household?.members)
      ? data.household.members
      : Array.isArray(data)
        ? data
        : [];

  return rawMembers
    .map((member: any) => normalizeMember(member?.user || member))
    .filter(
      (member: Member | null): member is Member =>
        Boolean(member?.id),
    );
}

/* =========================================================
   SIDEBAR & LOGO
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

function SidebarLinks({
  setMobileOpen,
}: {
  setMobileOpen?: (v: boolean) => void;
}) {
  const links = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: false,
    },
    {
      title: "Tasks",
      href: "/dashboard/tasks",
      icon: ListChecks,
      active: true,
    },
    {
      title: "Members",
      href: "/dashboard/members",
      icon: Users,
      active: false,
    },
    {
      title: "Feedback",
      href: "/dashboard/feedback",
      icon: MessageSquare,
      active: false,
    },
    {
      title: "Calendar",
      href: "/dashboard/calendar",
      icon: CalendarDays,
      active: false,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: false,
    },
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
   STATUS & RULE BADGES
========================================================= */

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    TO_DO: {
      label: "To Do",
      className: "bg-slate-100 text-slate-600",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-indigo-50 text-indigo-700",
    },
    DONE: {
      label: "Done",
      className: "bg-emerald-50 text-emerald-700",
    },
  };

  const current = config[status] || config.TO_DO;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function RuleBadge({ rule }: { rule: TaskRule }) {
  const config = {
    TEMPORARY: "bg-amber-50 text-amber-700",
    RECURRING: "bg-violet-50 text-violet-700",
    PERMANENT: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${config[rule]}`}
    >
      {formatRule(rule)}
    </span>
  );
}

/* =========================================================
   TASK CARD
========================================================= */

function TaskCard({
  task,
  currentUserId,
  onOpen,
  onDelete,
}: {
  task: Task;
  currentUserId: string;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const assignedNames =
    task.assignments?.map((a) => a.user?.name).filter(Boolean) || [];

  const completion =
    task.completions?.find((c) => c.userId === currentUserId) ||
    task.completions?.[0];

  const inProgressMinutes =
    task.status === "IN_PROGRESS" && completion?.startedAt
      ? getElapsedMinutes(completion.startedAt)
      : null;

  const completedMinutes =
    task.status === "DONE"
      ? completion?.timeTakenMinutes ??
        task.completions?.find(
          (c) => c.timeTakenMinutes != null,
        )?.timeTakenMinutes ??
        null
      : null;

  const isCreator = Boolean(
    currentUserId &&
      task.createdBy?.id &&
      task.createdBy.id === currentUserId,
  );

  return (
    <div className="group relative w-full rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <RuleBadge rule={task.rule} />
              <StatusBadge status={task.status} />

              {task.status === "IN_PROGRESS" &&
                inProgressMinutes !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 animate-pulse">
                    <Clock3 size={12} />
                    Timer running: {inProgressMinutes} min
                  </span>
                )}

              {task.status === "DONE" &&
                completedMinutes !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 size={12} />
                    Completed in {completedMinutes} min
                  </span>
                )}
            </div>

            <h3 className="truncate text-base font-bold text-[#172033]">
              {task.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#64748B]">
              {task.description || "No description provided."}
            </p>
          </div>

          <ChevronRight
            size={18}
            className="mt-1 shrink-0 text-[#94A3B8]"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
              Scheduled
            </p>

            <p className="mt-1 text-xs font-bold text-[#172033]">
              {formatDisplayDate(task.scheduledDate)}
            </p>
          </div>

          <div className="rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
              Assigned
            </p>

            <p className="mt-1 truncate text-xs font-bold text-[#172033]">
              {assignedNames.length > 0
                ? assignedNames.join(", ")
                : "No member"}
            </p>
          </div>
        </div>

        {task.rule === "RECURRING" && task.frequency && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <CalendarDays
              size={14}
              className="text-[#3B82F6]"
            />
            {formatFrequency(task.frequency)}
          </div>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
        <span className="text-[11px] font-medium text-[#94A3B8]">
          {task.estimatedMinutes
            ? `${task.estimatedMinutes} min estimated`
            : ""}
        </span>

        {isCreator && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
            title="Delete task"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY TOP CARDS
========================================================= */

function SummaryCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: typeof ListChecks;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#64748B]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#172033]">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-[11px] font-medium text-[#94A3B8]">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADD TASK MODAL
========================================================= */

function AddTaskModal({
  open,
  members,
  onClose,
  onCreated,
}: {
  open: boolean;
  members: Member[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rule, setRule] = useState<TaskRule>("TEMPORARY");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("MEDIUM");
  const [frequency, setFrequency] = useState("DAILY");
  const [scheduledDate, setScheduledDate] =
    useState(getTodayKey());
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [assignmentMode, setAssignmentMode] =
    useState<AssignmentMode>("SELECTED");
  const [selectedMembers, setSelectedMembers] = useState<
    string[]
  >([]);
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");
    setTitle("");
    setDescription("");
    setRule("TEMPORARY");
    setDifficulty("MEDIUM");
    setFrequency("DAILY");
    setScheduledDate(getTodayKey());
    setDueDate("");
    setEstimatedMinutes("");
    setAssignmentMode("SELECTED");
    setSelectedMembers([]);
    setCustomDays([]);
  }, [open]);

  if (!open) return null;

  const toggleMember = (memberId: string) => {
    setSelectedMembers((curr) =>
      curr.includes(memberId)
        ? curr.filter((id) => id !== memberId)
        : [...curr, memberId],
    );
  };

  const toggleCustomDay = (day: string) => {
    setCustomDays((curr) =>
      curr.includes(day)
        ? curr.filter((item) => item !== day)
        : [...curr, day],
    );
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (!scheduledDate) {
      setError("Please select a scheduled date.");
      return;
    }

    if (
      assignmentMode === "SELECTED" &&
      selectedMembers.length === 0
    ) {
      setError("Please select at least one member.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description:
            description.trim() || undefined,
          rule,
          difficulty,
          frequency:
            rule === "RECURRING"
              ? frequency
              : undefined,
          customDays:
            rule === "RECURRING" &&
            frequency === "CUSTOM"
              ? customDays
              : undefined,
          scheduledDate,
          dueDate: dueDate || undefined,
          estimatedMinutes: estimatedMinutes
            ? Number(estimatedMinutes)
            : undefined,
          assignmentMode,
          selectedUserIds:
            assignmentMode === "SELECTED"
              ? selectedMembers
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to create task.",
        );
      }

      await onCreated();
      onClose();
    } catch (saveError) {
      console.error(
        "CREATE_TASK_ERROR:",
        saveError,
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create task.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#172033]/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">
              Add New Task
            </h2>

            <p className="mt-1 text-xs text-[#64748B]">
              Create a household task and assign it.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#172033]">
              Task Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. Clean kitchen"
              className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033]">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={3}
              placeholder="Describe the task..."
              className="mt-2 w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-[#172033]">
                Task Type
              </label>

              <select
                value={rule}
                onChange={(e) =>
                  setRule(e.target.value as TaskRule)
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#3B82F6]"
              >
                <option value="TEMPORARY">
                  Temporary
                </option>
                <option value="RECURRING">
                  Recurring
                </option>
                <option value="PERMANENT">
                  Permanent
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033]">
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as Difficulty,
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#3B82F6]"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-[#172033]">
                Scheduled Date
              </label>

              <input
                type="date"
                value={scheduledDate}
                onChange={(e) =>
                  setScheduledDate(e.target.value)
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#172033]">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          {rule === "RECURRING" && (
            <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF] p-4">
              <label className="text-xs font-bold text-[#172033]">
                Frequency
              </label>

              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value)
                }
                className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-[#3B82F6]"
              >
                <option value="DAILY">Daily</option>
                <option value="EVERY_2_DAYS">
                  Every 2 days
                </option>
                <option value="EVERY_3_DAYS">
                  Every 3 days
                </option>
                <option value="WEEKLY">Weekly</option>
                <option value="EVERY_2_WEEKS">
                  Every 2 weeks
                </option>
                <option value="CUSTOM">Custom</option>
              </select>

              {frequency === "CUSTOM" && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-[#172033]">
                    Repeat On
                  </p>

                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {[
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          toggleCustomDay(day)
                        }
                        className={`rounded-lg px-2 py-2 text-[10px] font-bold transition ${
                          customDays.includes(day)
                            ? "bg-[#3B82F6] text-white"
                            : "bg-white text-[#64748B] hover:bg-blue-50"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#172033]">
              Estimated Time
            </label>

            <input
              type="number"
              min="1"
              value={estimatedMinutes}
              onChange={(e) =>
                setEstimatedMinutes(e.target.value)
              }
              placeholder="Minutes"
              className="mt-2 h-11 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172033]">
              Assignment
            </label>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  setAssignmentMode("SELECTED")
                }
                className={`rounded-xl border px-3 py-3 text-xs font-bold ${
                  assignmentMode === "SELECTED"
                    ? "border-[#3B82F6] bg-blue-50 text-[#2563EB]"
                    : "border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                Selected Members
              </button>

              <button
                type="button"
                onClick={() =>
                  setAssignmentMode("ALL")
                }
                className={`rounded-xl border px-3 py-3 text-xs font-bold ${
                  assignmentMode === "ALL"
                    ? "border-[#3B82F6] bg-blue-50 text-[#2563EB]"
                    : "border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                All Members
              </button>
            </div>
          </div>

          {assignmentMode === "SELECTED" && (
            <div>
              <p className="mb-2 text-xs font-bold text-[#172033]">
                Select Members
              </p>

              {members.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((member) => {
                    const selected =
                      selectedMembers.includes(
                        member.id,
                      );

                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() =>
                          toggleMember(member.id)
                        }
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[#3B82F6] bg-blue-50"
                            : "border-[#E2E8F0] hover:border-blue-200"
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {member.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#172033]">
                            {member.name}
                          </p>

                          <p className="truncate text-xs text-[#64748B]">
                            {member.email}
                          </p>
                        </div>

                        {selected && (
                          <CheckCircle2
                            size={18}
                            className="ml-auto text-[#3B82F6]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                  No household members available.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E2E8F0] px-5 py-3 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB] disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   EVIDENCE UPLOAD MODAL
========================================================= */

function EvidenceUploadModal({
  task,
  open,
  onClose,
  onUploaded,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFile(null);
    setPreview(null);
    setError("");
  }, [open]);

  if (!open || !task) return null;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(selected.type)
    ) {
      setError(
        "Please select a valid JPG, PNG, or WEBP image file.",
      );
      return;
    }

    if (selected.size > 8 * 1024 * 1024) {
      setError("File size must be under 8 MB.");
      return;
    }

    setError("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a completion photo.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/tasks/${task.id}/evidence`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to upload evidence.",
        );
      }

      if (data?.verified === false) {
        setError(
          data?.reason ||
            "Photo could not be verified by AI.",
        );
        return;
      }

      await onUploaded();
      onClose();
    } catch (err) {
      console.error(
        "UPLOAD_EVIDENCE_ERROR:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload evidence.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#172033]/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">
              Completion Evidence
            </h2>

            <p className="mt-1 text-xs text-[#64748B]">
              Upload proof photo to complete "
              {task.title}"
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border-2 border-dashed border-[#CBD5E1] p-6 text-center hover:border-blue-400">
            {preview ? (
              <div className="space-y-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="mx-auto max-h-56 rounded-xl object-contain shadow-sm"
                />

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3B82F6]">
                  <Upload size={22} />
                </div>

                <p className="text-sm font-bold text-[#172033]">
                  Click to select photo
                </p>

                <p className="text-xs text-[#94A3B8]">
                  JPG, PNG or WEBP (max 8MB)
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E2E8F0] px-5 py-3 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading || !file}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {uploading
                ? "Verifying & Saving..."
                : "Upload & Mark Done"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function DetailsModal({
  task,
  currentUserId,
  onClose,
  onStatusChange,
  onOpenEvidenceModal,
  onDelete,
  updating,
  deleting,
}: {
  task: Task | null;
  currentUserId: string;
  onClose: () => void;
  onStatusChange: (
    status: TaskStatus,
  ) => Promise<void>;
  onOpenEvidenceModal: () => void;
  onDelete: () => void | Promise<void>;
  updating: boolean;
  deleting: boolean;
}) {
  if (!task) return null;

  const assignments = task.assignments || [];

  const isAssigned = assignments.some(
    (a) => a.user?.id === currentUserId,
  );

  const isCreator = Boolean(
    currentUserId &&
      task.createdBy?.id &&
      task.createdBy.id === currentUserId,
  );

  const completion =
    task.completions?.find(
      (c) => c.userId === currentUserId,
    ) || task.completions?.[0];

  const inProgressMinutes =
    task.status === "IN_PROGRESS" &&
    completion?.startedAt
      ? getElapsedMinutes(
          completion.startedAt,
        )
      : null;

  const completedMinutes =
    task.status === "DONE"
      ? completion?.timeTakenMinutes ??
        task.completions?.find(
          (c) => c.timeTakenMinutes != null,
        )?.timeTakenMinutes ??
        null
      : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#172033]/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div className="min-w-0 pr-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <RuleBadge rule={task.rule} />
              <StatusBadge status={task.status} />
            </div>

            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#172033]">
              {task.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              {task.description ||
                "No description provided."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#172033]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#F8FAFC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                Task Type
              </p>

              <p className="mt-1 text-sm font-bold text-[#172033]">
                {formatRule(task.rule)}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8FAFC] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                Scheduled Date
              </p>

              <p className="mt-1 text-sm font-bold text-[#172033]">
                {formatDisplayDate(
                  task.scheduledDate,
                )}
              </p>
            </div>
          </div>

          {task.status === "IN_PROGRESS" &&
            inProgressMinutes !== null && (
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white animate-pulse">
                  <Clock3 size={20} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Timer Running
                  </p>

                  <p className="text-sm font-bold text-indigo-950">
                    Task started{" "}
                    {inProgressMinutes} minute
                    {inProgressMinutes === 1
                      ? ""
                      : "s"}{" "}
                    ago.
                  </p>
                </div>
              </div>
            )}

          {task.status === "DONE" &&
            completedMinutes !== null && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Task Completed!
                  </p>

                  <p className="text-sm font-bold text-emerald-950">
                    You completed your task in{" "}
                    {completedMinutes} minute
                    {completedMinutes === 1
                      ? ""
                      : "s"}
                    !
                  </p>
                </div>
              </div>
            )}

          <div>
            <p className="mb-3 text-sm font-bold text-[#172033]">
              Assigned Members
            </p>

            {assignments.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {assignments.map(
                  (assignment, index) => (
                    <div
                      key={
                        assignment.id ||
                        assignment.user?.id ||
                        index
                      }
                      className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
                        {(
                          assignment.user?.name ||
                          "M"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172033]">
                          {assignment.user?.name ||
                            "Member"}
                        </p>

                        {assignment.user?.email && (
                          <p className="truncate text-xs text-[#64748B]">
                            {assignment.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                No members assigned.
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-[#172033]">
              Task Progress & Action
            </p>

            {!isAssigned ? (
              <p className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-700">
                You are not assigned to this task.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {task.status === "TO_DO" && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      onStatusChange(
                        "IN_PROGRESS",
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB] disabled:opacity-60"
                  >
                    <Clock3 size={16} />
                    Start Task (Start Timer)
                  </button>
                )}

                {task.status === "IN_PROGRESS" && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={
                        onOpenEvidenceModal
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Upload size={16} />
                      Complete Task (Upload Proof)
                    </button>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        onStatusChange(
                          "TO_DO",
                        )
                      }
                      className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC]"
                    >
                      Reset to To Do
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:justify-between">
            {isCreator && (
              <button
                type="button"
                disabled={deleting}
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleting
                  ? "Deleting..."
                  : "Delete Task"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-xl bg-[#172033] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#243047]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN TASKS PAGE
========================================================= */

export default function TasksPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>(
    [],
  );

  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  const [householdRole, setHouseholdRole] =
    useState<"OWNER" | "MEMBER" | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addModalOpen, setAddModalOpen] =
    useState(false);

  const [selectedTask, setSelectedTask] =
    useState<Task | null>(null);

  const [evidenceModalOpen, setEvidenceModalOpen] =
    useState(false);

  const [updatingTask, setUpdatingTask] =
    useState(false);

  const [deletingTask, setDeletingTask] =
    useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | TaskStatus>("ALL");

  const [ruleFilter, setRuleFilter] =
    useState<"ALL" | TaskRule>("ALL");

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const [notificationAction, setNotificationAction] =
    useState<string | null>(null);

  const notificationRef =
    useRef<HTMLDivElement | null>(null);

  const currentUserId =
    currentUser?.id || "";

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "homesync-user",
        );

      if (storedUser) {
        const parsed = JSON.parse(
          storedUser,
        );

        if (
          parsed &&
          (parsed.id ||
            parsed.email ||
            parsed.name)
        ) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      setCurrentUser(null);
    }

    loadHousehold();
    loadTasks();
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  const loadHousehold = async () => {
    try {
      const response = await fetch(
        "/api/auth/household/current",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (
        response.ok &&
        data.success &&
        data.household
      ) {
        setMembers(extractMembers(data));

        setHouseholdRole(
          data.household.myRole || "",
        );
      }
    } catch (err) {
      console.error(
        "LOAD_HOUSEHOLD_ERROR:",
        err,
      );
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/tasks",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load tasks.",
        );
      }

      const apiTasks = Array.isArray(
        data?.tasks,
      )
        ? data.tasks
        : [];

      const normalized = apiTasks
        .map(normalizeTask)
        .filter((t: Task) =>
          Boolean(t.id),
        );

      setTasks(normalized);
    } catch (loadError) {
      console.error(
        "LOAD_TASKS_ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load tasks.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     NOTIFICATION LOAD
  ========================================================= */

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const response = await fetch(
        "/api/notifications",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const list = Array.isArray(
        data?.notifications,
      )
        ? data.notifications
        : Array.isArray(data)
          ? data
          : [];

      const normalizedNotifications: Notification[] =
        list.map((notification: any) => ({
          id: String(
            notification?.id || "",
          ),
          type: String(
            notification?.type || "",
          ),
          title: String(
            notification?.title ||
              "Notification",
          ),
          message: String(
            notification?.message || "",
          ),
          isRead:
            notification?.isRead === true,
          createdAt:
            notification?.createdAt || "",
          relatedTaskId:
            notification?.relatedTaskId != null
              ? String(
                  notification.relatedTaskId,
                )
              : null,
          relatedFeedbackId:
            notification?.relatedFeedbackId != null
              ? String(
                  notification.relatedFeedbackId,
                )
              : null,
        }));

      setNotifications(
        normalizedNotifications.filter(
          (notification) =>
            Boolean(notification.id),
        ),
      );
    } catch (notificationError) {
      console.error(
        "LOAD_NOTIFICATIONS_ERROR:",
        notificationError,
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  /* =========================================================
     DYNAMIC BLUE UNREAD DOT
  ========================================================= */

  const unreadCount = notifications.filter(
    (notification) =>
      !notification.isRead,
  ).length;

  const hasUnreadNotifications =
    notifications.some(
      (notification) =>
        !notification.isRead,
    );

  /* =========================================================
     NOTIFICATION ACTIONS
  ========================================================= */

  const markNotificationRead = async (
    notificationId: string,
  ) => {
    try {
      setNotificationAction(
        `read-${notificationId}`,
      );

      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            notificationId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to mark notification as read.",
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id ===
          notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (notificationError) {
      console.error(
        "MARK_NOTIFICATION_READ_ERROR:",
        notificationError,
      );
    } finally {
      setNotificationAction(null);
    }
  };

  const markAllNotificationsRead =
    async () => {
      try {
        setNotificationAction(
          "mark-all",
        );

        const response = await fetch(
          "/api/notifications",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              markAllRead: true,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to mark all notifications as read.",
          );
        }

        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        );
      } catch (notificationError) {
        console.error(
          "MARK_ALL_NOTIFICATIONS_READ_ERROR:",
          notificationError,
        );
      } finally {
        setNotificationAction(null);
      }
    };

  const deleteNotification = async (
    notificationId: string,
  ) => {
    try {
      setNotificationAction(
        `delete-${notificationId}`,
      );

      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete notification.",
        );
      }

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !==
            notificationId,
        ),
      );
    } catch (notificationError) {
      console.error(
        "DELETE_NOTIFICATION_ERROR:",
        notificationError,
      );
    } finally {
      setNotificationAction(null);
    }
  };

  const handleViewNotification =
    async (
      notification: Notification,
    ) => {
      if (!notification.isRead) {
        await markNotificationRead(
          notification.id,
        );
      }

      window.location.href =
        "/dashboard/notifications";
    };

  /* =========================================================
     TASK DATA
  ========================================================= */

  const todayKey = getTodayKey();

  const todayTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        getDateKey(
          task.scheduledDate,
        ) === todayKey,
    );
  }, [tasks, todayKey]);

  const myTasks = useMemo(() => {
    if (!currentUserId) return [];

    return todayTasks.filter((task) =>
      task.assignments?.some(
        (a) =>
          a.user?.id === currentUserId,
      ),
    );
  }, [todayTasks, currentUserId]);

  const filteredMyTasks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return myTasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title
          .toLowerCase()
          .includes(query) ||
        task.description
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        task.status === statusFilter;

      const matchesRule =
        ruleFilter === "ALL" ||
        task.rule === ruleFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRule
      );
    });
  }, [
    myTasks,
    search,
    statusFilter,
    ruleFilter,
  ]);

  const filteredHouseholdTasks =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return todayTasks.filter((task) => {
        const matchesSearch =
          !query ||
          task.title
            .toLowerCase()
            .includes(query) ||
          task.description
            ?.toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          task.status === statusFilter;

        const matchesRule =
          ruleFilter === "ALL" ||
          task.rule === ruleFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesRule
        );
      });
    }, [
      todayTasks,
      search,
      statusFilter,
      ruleFilter,
    ]);

  const stats = useMemo(() => {
    const done = todayTasks.filter(
      (t) => t.status === "DONE",
    ).length;

    const inProgress =
      todayTasks.filter(
        (t) =>
          t.status === "IN_PROGRESS",
      ).length;

    const recurring =
      todayTasks.filter(
        (t) => t.rule === "RECURRING",
      ).length;

    return {
      total: todayTasks.length,
      done,
      inProgress,
      recurring,
    };
  }, [todayTasks]);

  const myStats = useMemo(() => {
    const done = myTasks.filter(
      (t) => t.status === "DONE",
    ).length;

    const pending = myTasks.filter(
      (t) =>
        t.status === "TO_DO" ||
        t.status === "IN_PROGRESS",
    ).length;

    return {
      total: myTasks.length,
      done,
      pending,
    };
  }, [myTasks]);

  /* =========================================================
     TASK STATUS
  ========================================================= */

  const updateStatus = async (
    task: Task,
    status: TaskStatus,
  ) => {
    try {
      setUpdatingTask(true);
      setError("");

      const response = await fetch(
        `/api/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data?.requiresEvidence) {
          setEvidenceModalOpen(true);
          return;
        }

        throw new Error(
          data?.message ||
            "Unable to update task status.",
        );
      }

      await loadTasks();

      if (
        selectedTask?.id === task.id
      ) {
        setSelectedTask(
          data.task
            ? normalizeTask(data.task)
            : null,
        );
      }

      await loadNotifications();
    } catch (updateError) {
      console.error(
        "UPDATE_TASK_STATUS_ERROR:",
        updateError,
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update task status.",
      );
    } finally {
      setUpdatingTask(false);
    }
  };

  const deleteTaskById = async (
    taskId: string,
    title?: string,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title || "this task"}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingTask(true);
      setError("");

      const response = await fetch(
        `/api/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete task.",
        );
      }

      setTasks((curr) =>
        curr.filter(
          (t) => t.id !== taskId,
        ),
      );

      if (
        selectedTask?.id === taskId
      ) {
        setSelectedTask(null);
      }
    } catch (deleteError) {
      console.error(
        "DELETE_TASK_ERROR:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete task.",
      );
    } finally {
      setDeletingTask(false);
    }
  };

  const displayName =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const profileImage =
    currentUser?.imageUrl ||
    currentUser?.image ||
    "";

  const userInitial =
    displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#172033] lg:flex">
          <SidebarContent />
        </aside>

        {/* MOBILE SIDEBAR */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[#172033]/50 lg:hidden"
              onClick={() =>
                setMobileOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#172033] lg:hidden">
              <div className="flex items-center justify-between px-5 py-5">
                <Logo />

                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="rounded-lg p-2 text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <SidebarLinks
                setMobileOpen={
                  setMobileOpen
                }
              />
            </aside>
          </>
        )}

        {/* MAIN AREA */}
        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          {/* NAVBAR */}
          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
            <div className="flex h-20 items-center justify-between px-5 sm:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(true)
                  }
                  className="rounded-xl border border-[#E2E8F0] p-2.5 text-[#172033] lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={21} />
                </button>

                <div>
                  <p className="text-sm font-semibold text-[#172033]">
                    Tasks
                  </p>

                  <p className="hidden text-xs text-[#94A3B8] sm:block">
                    Manage household responsibilities
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* =================================================
                    NOTIFICATION DROPDOWN
                ================================================== */}
                <div
                  ref={notificationRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        (current) =>
                          !current,
                      )
                    }
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition ${
                      notificationsOpen
                        ? "border-blue-200 bg-[#EFF6FF] text-[#3B82F6]"
                        : "border-[#E2E8F0] text-[#64748B] hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                    }`}
                    aria-label="Notifications"
                  >
                    <Bell
                      size={19}
                      className={
                        hasUnreadNotifications
                          ? "text-[#3B82F6]"
                          : ""
                      }
                    />

                    {/* DYNAMIC BLUE DOT */}
                    {hasUnreadNotifications && (
                      <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3B82F6] opacity-50" />

                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-[#3B82F6]" />
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
                      {/* POPUP HEADER */}
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-4">
                        <div>
                          <h3 className="text-sm font-bold text-[#172033]">
                            Notifications
                          </h3>

                          <p className="mt-1 text-[11px] text-[#94A3B8]">
                            Household activity and reminders
                          </p>
                        </div>

                        {unreadCount >
                          0 && (
                          <button
                            type="button"
                            disabled={
                              notificationAction ===
                              "mark-all"
                            }
                            onClick={
                              markAllNotificationsRead
                            }
                            className="text-[11px] font-bold text-[#3B82F6] hover:text-[#2563EB] disabled:opacity-50"
                          >
                            {notificationAction ===
                            "mark-all"
                              ? "Updating..."
                              : "Mark all read"}
                          </button>
                        )}
                      </div>

                      {/* POPUP BODY */}
                      <div className="max-h-[420px] overflow-y-auto">
                        {notificationLoading &&
                        notifications.length ===
                          0 ? (
                          <div className="px-6 py-10 text-center">
                            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                            <p className="mt-3 text-xs font-semibold text-[#64748B]">
                              Loading notifications...
                            </p>
                          </div>
                        ) : notifications.length ===
                          0 ? (
                          <div className="px-6 py-10 text-center">
                            <Bell
                              size={25}
                              className="mx-auto text-[#CBD5E1]"
                            />

                            <p className="mt-2 text-xs font-semibold text-[#64748B]">
                              No notifications
                            </p>

                            <p className="mt-1 text-[11px] text-[#94A3B8]">
                              New household activity will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#E2E8F0]">
                            {notifications
                              .slice(0, 8)
                              .map(
                                (
                                  notification,
                                ) => (
                                  <div
                                    key={
                                      notification.id
                                    }
                                    className={`p-4 transition hover:bg-[#F8FAFC] ${
                                      !notification.isRead
                                        ? "bg-blue-50/40"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex gap-3">
                                      <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                          notification.isRead
                                            ? "bg-[#F1F5F9] text-[#64748B]"
                                            : "bg-blue-100 text-[#3B82F6]"
                                        }`}
                                      >
                                        <Bell
                                          size={16}
                                        />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                          <p className="text-xs font-bold text-[#172033]">
                                            {
                                              notification.title
                                            }
                                          </p>

                                          {!notification.isRead && (
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3B82F6]" />
                                          )}
                                        </div>

                                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                                          {
                                            notification.message
                                          }
                                        </p>

                                        <p className="mt-2 text-[10px] font-medium text-[#94A3B8]">
                                          {formatNotificationTime(
                                            notification.createdAt,
                                          )}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleViewNotification(
                                                notification,
                                              )
                                            }
                                            disabled={
                                              notificationAction ===
                                              `read-${notification.id}`
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-2.5 py-1.5 text-[10px] font-bold text-[#64748B] transition-colors hover:border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white disabled:opacity-50"
                                          >
                                            <Eye
                                              size={
                                                12
                                              }
                                            />
                                            View Details
                                          </button>

                                          {!notification.isRead && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                markNotificationRead(
                                                  notification.id,
                                                )
                                              }
                                              disabled={
                                                notificationAction ===
                                                `read-${notification.id}`
                                              }
                                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#64748B] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB] disabled:opacity-50"
                                            >
                                              <Check
                                                size={
                                                  12
                                                }
                                              />

                                              {notificationAction ===
                                              `read-${notification.id}`
                                                ? "Updating..."
                                                : "Mark as Read"}
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteNotification(
                                                notification.id,
                                              )
                                            }
                                            disabled={
                                              notificationAction ===
                                              `delete-${notification.id}`
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-[10px] font-bold text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                          >
                                            <Trash2
                                              size={
                                                12
                                              }
                                            />

                                            {notificationAction ===
                                            `delete-${notification.id}`
                                              ? "Deleting..."
                                              : "Delete"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                          </div>
                        )}
                      </div>

                      {/* POPUP FOOTER */}
                      {notifications.length >
                        0 && (
                        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(
                                false,
                              );
                              window.location.href =
                                "/dashboard/notifications";
                            }}
                             className="w-full text-center text-[11px] font-semibold text-[#3B82F6] transition hover:text-[#2563EB]"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* USER PROFILE */}
                {currentUser ? (
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-2 py-1.5 transition hover:border-blue-200"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-sm font-bold text-[#3B82F6]">
                        {userInitial}
                      </div>
                    )}

                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-semibold">
                        {displayName}
                      </p>

                      <p className="text-xs text-[#94A3B8]">
                        {householdRole ===
                        "OWNER"
                          ? "Household owner"
                          : "Household member"}
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

          {/* CONTENT */}
          <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:px-10">
            <section className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#3B82F6]">
                  Today
                </p>

                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172033] sm:text-4xl">
                  Household Tasks
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                  Manage today's responsibilities,
                  keep assignments balanced, and
                  track household progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAddModalOpen(true)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
              >
                <Plus size={18} />
                Add Tasks
              </button>
            </section>

            {error && (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                  className="shrink-0 text-red-500 hover:text-red-700"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* TOP SUMMARY CARDS */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="Today's Tasks"
                value={stats.total}
                subtitle="All household tasks today"
                icon={ListChecks}
                iconClass="bg-blue-50 text-[#3B82F6]"
              />

              <SummaryCard
                label="My Completed"
                value={myStats.done}
                subtitle="Completed by you today"
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <SummaryCard
                label="My Pending"
                value={myStats.pending}
                subtitle="Assigned to you remaining"
                icon={Clock3}
                iconClass="bg-amber-50 text-amber-600"
              />

              <SummaryCard
                label="In Progress"
                value={stats.inProgress}
                subtitle="Timer active currently"
                icon={Clock3}
                iconClass="bg-indigo-50 text-indigo-600"
              />

              <SummaryCard
                label="Recurring"
                value={stats.recurring}
                subtitle="Automated series"
                icon={CalendarDays}
                iconClass="bg-violet-50 text-violet-600"
              />
            </section>

            {/* FILTERS */}
            <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value,
                      )
                    }
                    placeholder="Search today's tasks..."
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#3B82F6]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "ALL"
                        | TaskStatus,
                    )
                  }
                  className="h-11 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#172033] outline-none focus:border-[#3B82F6]"
                >
                  <option value="ALL">
                    All Status
                  </option>
                  <option value="TO_DO">
                    To Do
                  </option>
                  <option value="IN_PROGRESS">
                    In Progress
                  </option>
                  <option value="DONE">
                    Completed
                  </option>
                </select>

                <select
                  value={ruleFilter}
                  onChange={(e) =>
                    setRuleFilter(
                      e.target.value as
                        | "ALL"
                        | TaskRule,
                    )
                  }
                  className="h-11 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#172033] outline-none focus:border-[#3B82F6]"
                >
                  <option value="ALL">
                    All Types
                  </option>
                  <option value="TEMPORARY">
                    Temporary
                  </option>
                  <option value="RECURRING">
                    Recurring
                  </option>
                  <option value="PERMANENT">
                    Permanent
                  </option>
                </select>
              </div>
            </section>

            {/* MY TASKS */}
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#172033]">
                    My Tasks
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    {myStats.total} assigned
                    to you today
                    {myStats.total > 0 &&
                      ` • ${myStats.done} completed • ${myStats.pending} pending`}
                  </p>
                </div>

                <Link
                  href="/dashboard/tasks/history?type=my"
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#3B82F6] transition hover:text-[#2563EB]"
                >
                  View More
                  <ChevronRight
                    size={16}
                  />
                </Link>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                  <p className="mt-4 text-sm font-semibold text-[#64748B]">
                    Loading tasks...
                  </p>
                </div>
              ) : filteredMyTasks.length >
                0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredMyTasks.map(
                    (task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={
                          currentUserId
                        }
                        onOpen={() =>
                          setSelectedTask(
                            task,
                          )
                        }
                        onDelete={(e) => {
                          e.stopPropagation();
                          deleteTaskById(
                            task.id,
                            task.title,
                          );
                        }}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2F7] text-[#94A3B8]">
                    <ListChecks
                      size={25}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#172033]">
                    No tasks assigned
                  </h3>

                  <p className="mt-2 text-sm text-[#64748B]">
                    You don't have any matching
                    tasks for today.
                  </p>
                </div>
              )}
            </section>

            {/* HOUSEHOLD TASKS */}
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#172033]">
                    Household Tasks
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    All tasks scheduled for today
                  </p>
                </div>

                <Link
                  href="/dashboard/tasks/history?type=household"
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#3B82F6] transition hover:text-[#2563EB]"
                >
                  View More
                  <ChevronRight
                    size={16}
                  />
                </Link>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                  <p className="mt-4 text-sm font-semibold text-[#64748B]">
                    Loading household tasks...
                  </p>
                </div>
              ) : filteredHouseholdTasks.length >
                0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredHouseholdTasks.map(
                    (task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        currentUserId={
                          currentUserId
                        }
                        onOpen={() =>
                          setSelectedTask(
                            task,
                          )
                        }
                        onDelete={(e) => {
                          e.stopPropagation();
                          deleteTaskById(
                            task.id,
                            task.title,
                          );
                        }}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2F7] text-[#94A3B8]">
                    <CalendarDays
                      size={25}
                    />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#172033]">
                    No household tasks today
                  </h3>

                  <p className="mt-2 text-sm text-[#64748B]">
                    Add a task or check another
                    date from task history.
                  </p>
                </div>
              )}
            </section>
          </section>

          {/* FOOTER */}
          <footer className="mt-12 border-y border-[#E2E8F0] bg-white shadow-sm">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:px-8 md:flex-row lg:px-10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3B82F6] text-white">
                  <Home
                    size={18}
                    strokeWidth={2.2}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#172033]">
                    HomeSync
                  </p>

                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Share the work. Balance the
                    home.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#64748B]">
                © {new Date().getFullYear()}{" "}
                HomeSync. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>

      <AddTaskModal
        open={addModalOpen}
        members={members}
        onClose={() =>
          setAddModalOpen(false)
        }
        onCreated={async () => {
          await loadHousehold();
          await loadTasks();
          await loadNotifications();
        }}
      />

      <DetailsModal
        task={selectedTask}
        currentUserId={currentUserId}
        onClose={() =>
          setSelectedTask(null)
        }
        onStatusChange={async (status) => {
          if (!selectedTask) return;

          await updateStatus(
            selectedTask,
            status,
          );
        }}
        onOpenEvidenceModal={() =>
          setEvidenceModalOpen(true)
        }
        onDelete={async () => {
          if (selectedTask) {
            await deleteTaskById(
              selectedTask.id,
              selectedTask.title,
            );
          }
        }}
        updating={updatingTask}
        deleting={deletingTask}
      />

      <EvidenceUploadModal
        task={selectedTask}
        open={evidenceModalOpen}
        onClose={() =>
          setEvidenceModalOpen(false)
        }
        onUploaded={async () => {
          await loadTasks();
          await loadNotifications();
          setSelectedTask(null);
        }}
      />
    </main>
  );
}