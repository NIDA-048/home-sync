"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
  Eye,
} from "lucide-react";

type TaskRule = "TEMPORARY" | "RECURRING" | "PERMANENT";

type TaskStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DONE";

type UserRole = "OWNER" | "MEMBER";

type CalendarTask = {
  id: string;
  title: string;
  description?: string;
  rule: TaskRule;
  status: TaskStatus;
  date: string;
  dueDate?: string;
  estimatedMinutes?: number;
  memberName?: string;
  memberImage?: string;
  assignedUserId?: string;
};

type Reminder = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: "PERSONAL" | "HOUSEHOLD";
};

type LoggedInUser = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  image?: string;
  role?: UserRole | string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: string | null;
  relatedFeedbackId?: string | null;
  createdAt: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: ListChecks,
  },
  {
    label: "Members",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "Feedback",
    href: "/dashboard/feedback",
    icon: MessageSquare,
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function Logo() {
  return (
    <Link href="/landing" className="flex items-center gap-3">
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
  setMobileOpen?: (value: boolean) => void;
}) {
  return (
    <nav className="flex-1 px-3 py-6">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        Workspace
      </p>

      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/dashboard/calendar";

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarContent({
  setMobileOpen,
}: {
  setMobileOpen?: (value: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <SidebarLinks setMobileOpen={setMobileOpen} />

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
    </div>
  );
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startingDay =
    firstDay.getDay() === 0
      ? 6
      : firstDay.getDay() - 1;

  const totalDays = lastDay.getDate();

  const previousMonthLastDay = new Date(
    year,
    month,
    0
  ).getDate();

  const cells: {
    date: Date;
    currentMonth: boolean;
  }[] = [];

  for (let i = startingDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(
        year,
        month - 1,
        previousMonthLastDay - i
      ),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  let nextDay = 1;

  while (cells.length < 42) {
    cells.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });

    nextDay++;
  }

  return cells;
}

function dateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * IMPORTANT:
 * Never use new Date("YYYY-MM-DD") for calendar dates.
 * JavaScript treats that as UTC and it can become the previous
 * day in Pakistan timezone.
 *
 * We always take the date part directly from API values.
 */
function apiDateKey(value?: string | null) {
  if (!value) {
    return "";
  }

  const raw = String(value).trim();

  const directMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
  }

  return "";
}

function formatDate(dateString: string) {
  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function ruleLabel(rule: TaskRule) {
  if (rule === "RECURRING") {
    return "Recurring";
  }

  if (rule === "PERMANENT") {
    return "Permanent";
  }

  return "Temporary";
}

function ruleClass(rule: TaskRule) {
  if (rule === "RECURRING") {
    return "bg-blue-50 text-blue-700";
  }

  if (rule === "PERMANENT") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-amber-50 text-amber-700";
}

function statusLabel(status: TaskStatus) {
  if (status === "IN_PROGRESS") {
    return "In Progress";
  }

  if (
    status === "COMPLETED" ||
    status === "DONE"
  ) {
    return "Completed";
  }

  return "To Do";
}

function statusClass(status: TaskStatus) {
  if (
    status === "COMPLETED" ||
    status === "DONE"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getInitials(name?: string) {
  if (!name?.trim()) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getNotificationTitle(
  type: string,
  title: string
) {
  switch (type) {
    case "REMINDER":
      return title || "Reminder";

    case "TASK_ASSIGNED":
      return title || "Task Assigned";

    case "TASK_DUE_SOON":
      return title || "Task Due Soon";

    case "TASK_COMPLETED":
      return title || "Task Completed";

    case "TASK_REASSIGNED":
      return title || "Task Reassigned";

    case "FEEDBACK_ACTIVITY":
    case "FEEDBACK":
      return title || "Feedback Activity";

    case "GENERAL":
      return title || "Notification";

    default:
      return title || "Notification";
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "REMINDER":
      return <Bell size={16} />;

    case "TASK_ASSIGNED":
      return <ListChecks size={16} />;

    case "TASK_DUE_SOON":
      return <Clock3 size={16} />;

    case "TASK_COMPLETED":
      return <CheckCircle2 size={16} />;

    case "TASK_REASSIGNED":
      return <Users size={16} />;

    case "FEEDBACK_ACTIVITY":
    case "FEEDBACK":
      return <MessageSquare size={16} />;

    case "GENERAL":
      return <Bell size={16} />;

    default:
      return <Bell size={16} />;
  }
}

/*
 * IMPORTANT:
 * All notification "View Details" buttons from the Calendar
 * notification popup now open the Notifications page.
 *
 * Layout/UI is unchanged.
 */
function getNotificationHref(
  notification: NotificationItem
) {
  switch (notification.type) {
    case "REMINDER":
    case "FEEDBACK_ACTIVITY":
    case "FEEDBACK":
    case "TASK_DUE_SOON":
    case "TASK_ASSIGNED":
    case "TASK_COMPLETED":
    case "TASK_REASSIGNED":
    case "GENERAL":
      return "/dashboard/notifications";

    default:
      return "/dashboard/notifications";
  }
}

function ReminderModal({
  selectedDate,
  onClose,
  onSave,
  saving,
}: {
  selectedDate: Date;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    time: string,
    type: "PERSONAL" | "HOUSEHOLD"
  ) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] =
    useState<"PERSONAL" | "HOUSEHOLD">(
      "PERSONAL"
    );

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim() || saving) {
      return;
    }

    onSave(
      title.trim(),
      description.trim(),
      time,
      type
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172033]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                <Bell size={18} />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                New Reminder
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#172033]">
              Add a Reminder
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              {formatDate(
                dateKey(selectedDate)
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#172033]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div>
            <label
              htmlFor="reminder-title"
              className="mb-2 block text-sm font-semibold text-[#172033]"
            >
              Reminder Title
            </label>

            <input
              id="reminder-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Buy groceries"
              maxLength={120}
              className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div>
            <label
              htmlFor="reminder-description"
              className="mb-2 block text-sm font-semibold text-[#172033]"
            >
              Description
              <span className="ml-1 font-normal text-[#94A3B8]">
                (Optional)
              </span>
            </label>

            <textarea
              id="reminder-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Add some details..."
              rows={4}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reminder-time"
                className="mb-2 block text-sm font-semibold text-[#172033]"
              >
                Time
              </label>

              <div className="relative">
                <Clock3
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />

                <input
                  id="reminder-time"
                  type="time"
                  value={time}
                  onChange={(event) =>
                    setTime(
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-3 text-sm text-[#172033] outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reminder-type"
                className="mb-2 block text-sm font-semibold text-[#172033]"
              >
                Reminder Type
              </label>

              <select
                id="reminder-type"
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value as
                      | "PERSONAL"
                      | "HOUSEHOLD"
                  )
                }
                className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#172033] outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
              >
                <option value="PERSONAL">
                  Personal
                </option>

                <option value="HOUSEHOLD">
                  Household
                </option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-[#EFF6FF] p-4">
            <div className="flex gap-3">
              <Bell
                size={18}
                className="mt-0.5 shrink-0 text-[#3B82F6]"
              />

              <p className="text-xs leading-5 text-[#64748B]">
                Personal reminders are visible to you.
                Household reminders are shared with your
                household members.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-[#E2E8F0] px-5 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#172033] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />

              {saving
                ? "Saving..."
                : "Save Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReminderDetailsModal({
  reminder,
  onClose,
  onDelete,
  deleting,
}: {
  reminder: Reminder;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172033]/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Bell size={19} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#172033]">
              {reminder.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#64748B] transition hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {reminder.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Description
              </p>

              <p className="mt-2 text-sm leading-6 text-[#475569]">
                {reminder.description}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-2 text-[#64748B]">
                <CalendarDays size={16} />

                <span className="text-xs font-semibold">
                  Date
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#172033]">
                {formatDate(reminder.date)}
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-2 text-[#64748B]">
                <Clock3 size={16} />

                <span className="text-xs font-semibold">
                  Time
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#172033]">
                {reminder.time}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Type
            </p>

            <p className="mt-1 text-sm font-semibold text-purple-900">
              {reminder.type === "PERSONAL"
                ? "Personal Reminder"
                : "Household Reminder"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />

              {deleting
                ? "Deleting..."
                : "Delete Reminder"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="h-11 flex-1 rounded-xl bg-[#172033] text-sm font-semibold text-white transition hover:bg-[#243047]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [selectedReminder, setSelectedReminder] =
    useState<Reminder | null>(null);

  const [reminderModalOpen, setReminderModalOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [reminders, setReminders] =
    useState<Reminder[]>([]);

  const [tasks, setTasks] =
    useState<CalendarTask[]>([]);

  const [loggedInUser, setLoggedInUser] =
    useState<LoggedInUser | null>(null);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [loadingTasks, setLoadingTasks] =
    useState(true);

  const [loadingReminders, setLoadingReminders] =
    useState(true);

  const [notificationLoading, setNotificationLoading] =
    useState(true);

  const [reminderSaving, setReminderSaving] =
    useState(false);

  const [reminderDeleting, setReminderDeleting] =
    useState(false);

  const [notificationAction, setNotificationAction] =
    useState("");

  /* =====================================================
     LOAD REAL LOGGED-IN USER
  ===================================================== */

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "homesync-user"
        );

      if (!storedUser) {
        return;
      }

      const parsedUser =
        JSON.parse(storedUser);

      setLoggedInUser({
        id: parsedUser?.id,
        name: parsedUser?.name,
        email: parsedUser?.email,
        imageUrl:
          parsedUser?.imageUrl ||
          parsedUser?.image ||
          parsedUser?.profileImage ||
          "",
        image:
          parsedUser?.image ||
          "",
        role:
          parsedUser?.role,
      });
    } catch (error) {
      console.error(
        "LOAD_CALENDAR_USER_ERROR:",
        error
      );
    }
  }, []);

  /* =====================================================
     LOAD REAL TASKS
  ===================================================== */

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);

      const response =
        await fetch("/api/tasks", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to load tasks."
        );
      }

      const currentUserId =
        loggedInUser?.id;

      if (!currentUserId) {
        setTasks([]);
        return;
      }

      const mappedTasks: CalendarTask[] =
        (data.tasks || [])
          .map((task: any) => {
            const assignment =
              task.assignments?.find(
                (item: any) =>
                  item?.user?.id ===
                    currentUserId ||
                  item?.userId ===
                    currentUserId
              );

            if (!assignment) {
              return null;
            }

            const assignedUser =
              assignment.user;

            return {
              id: String(task.id),

              title: String(
                task.title ||
                  "Untitled Task"
              ),

              description:
                task.description ||
                undefined,

              rule:
                task.rule ===
                    "RECURRING" ||
                task.rule ===
                    "PERMANENT" ||
                task.rule ===
                    "TEMPORARY"
                  ? task.rule
                  : "TEMPORARY",

              status:
                task.status ===
                "IN_PROGRESS"
                  ? "IN_PROGRESS"
                  : task.status ===
                    "COMPLETED"
                  ? "COMPLETED"
                  : task.status ===
                    "DONE"
                  ? "DONE"
                  : "TO_DO",

              date: apiDateKey(
                task.scheduledDate
              ),

              dueDate:
                task.dueDate
                  ? apiDateKey(
                      task.dueDate
                    )
                  : undefined,

              estimatedMinutes:
                task.estimatedMinutes ||
                undefined,

              memberName:
                assignedUser?.name ||
                "Assigned Member",

              memberImage:
                assignedUser?.imageUrl ||
                undefined,

              assignedUserId:
                assignedUser?.id ||
                assignment.userId,
            } as CalendarTask;
          })
          .filter(
            (
              task: CalendarTask | null
            ): task is CalendarTask =>
              Boolean(task?.date)
          );

      setTasks(
        mappedTasks.filter(
          (task) =>
            task.assignedUserId ===
            currentUserId
        )
      );
    } catch (error) {
      console.error(
        "LOAD_CALENDAR_TASKS_ERROR:",
        error
      );

      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (!loggedInUser?.id) {
      return;
    }

    loadTasks();
  }, [loggedInUser?.id]);

  /* =====================================================
     LOAD REAL REMINDERS
  ===================================================== */

  const loadReminders = async () => {
    try {
      setLoadingReminders(true);

      const response =
        await fetch(
          "/api/reminders",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load reminders."
        );
      }

      const reminderData =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data?.reminders
            )
          ? data.reminders
          : [];

      const mappedReminders: Reminder[] =
        reminderData
          .map((item: any) => ({
            id: String(item.id),

            title: String(
              item.title ||
                "Reminder"
            ),

            description:
              item.description ||
              item.message ||
              undefined,

            /*
             * IMPORTANT:
             * Keep API date as YYYY-MM-DD.
             * Do NOT convert it through new Date().
             */
            date: apiDateKey(
              item.date ||
                item.reminderDate ||
                item.scheduledDate
            ),

            time: String(
              item.time ||
                item.reminderTime ||
                "09:00"
            ).slice(0, 5),

            type:
              item.type ===
              "HOUSEHOLD"
                ? "HOUSEHOLD"
                : "PERSONAL",
          }))
          .filter(
            (item: Reminder) =>
              Boolean(item.date)
          );

      setReminders(
        mappedReminders
      );
    } catch (error) {
      console.error(
        "LOAD_CALENDAR_REMINDERS_ERROR:",
        error
      );

      setReminders([]);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    loadReminders();

    const interval =
      window.setInterval(() => {
        loadReminders();
      }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* =====================================================
     LOAD REAL NOTIFICATIONS
  ===================================================== */

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const response =
        await fetch(
          "/api/notifications",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        return;
      }

      let incomingNotifications: NotificationItem[] =
        [];

      if (Array.isArray(data)) {
        incomingNotifications =
          data;
      } else if (
        Array.isArray(
          data?.notifications
        )
      ) {
        incomingNotifications =
          data.notifications;
      }

      /*
       * IMPORTANT:
       * Keep ALL notification types:
       * Reminder + Feedback + Task + any other
       * notification returned by the API.
       *
       * Sort again on frontend so newest is always
       * displayed first even if API ordering changes.
       */
      incomingNotifications =
        [...incomingNotifications].sort(
          (first, second) => {
            const firstTime =
              new Date(
                first.createdAt
              ).getTime();

            const secondTime =
              new Date(
                second.createdAt
              ).getTime();

            return (
              secondTime - firstTime
            );
          }
        );

      setNotifications(
        incomingNotifications
      );
    } catch (error) {
      console.error(
        "LOAD_CALENDAR_NOTIFICATIONS_ERROR:",
        error
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval =
      window.setInterval(() => {
        loadNotifications();
      }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* =====================================================
     NOTIFICATION HELPERS
  ===================================================== */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  const hasUnreadNotifications =
    notifications.some(
      (notification) =>
        !notification.isRead
    );

  const markNotificationRead =
    async (
      notificationId: string
    ) => {
      try {
        setNotificationAction(
          `read-${notificationId}`
        );

        const response =
          await fetch(
            "/api/notifications",
            {
              method: "PATCH",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                notificationId,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to mark notification as read."
          );
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,
                      isRead: true,
                    }
                  : notification
            )
        );
      } catch (error) {
        console.error(
          "MARK_NOTIFICATION_READ_ERROR:",
          error
        );
      } finally {
        setNotificationAction("");
      }
    };

  const markAllNotificationsRead =
    async () => {
      try {
        setNotificationAction(
          "mark-all"
        );

        const response =
          await fetch(
            "/api/notifications",
            {
              method: "PATCH",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                markAllRead: true,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to mark notifications as read."
          );
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "MARK_ALL_NOTIFICATIONS_READ_ERROR:",
          error
        );
      } finally {
        setNotificationAction("");
      }
    };

  /*
   * Delete only the selected notification.
   * Other feedback/task/reminder notifications stay untouched.
   */
  const deleteNotification =
    async (
      notificationId: string
    ) => {
      try {
        setNotificationAction(
          `delete-${notificationId}`
        );

        const response =
          await fetch(
            "/api/notifications",
            {
              method: "DELETE",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                notificationId,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to delete notification."
          );
        }

        setNotifications(
          (previous) =>
            previous.filter(
              (notification) =>
                notification.id !==
                notificationId
            )
        );
      } catch (error) {
        console.error(
          "DELETE_NOTIFICATION_ERROR:",
          error
        );
      } finally {
        setNotificationAction("");
      }
    };

  const handleViewNotification =
    async (
      notification: NotificationItem
    ) => {
      if (!notification.isRead) {
        await markNotificationRead(
          notification.id
        );
      }

      const href =
        getNotificationHref(
          notification
        );

      setNotificationsOpen(false);

      if (href) {
        window.location.href =
          href;
      }
    };

  /* =====================================================
     CALENDAR DATA
  ===================================================== */

  const days = useMemo(
    () =>
      getMonthDays(
        currentMonth
      ),
    [currentMonth]
  );

  const selectedDateKey =
    dateKey(selectedDate);

  const todayKey =
    dateKey(new Date());

  const monthName =
    currentMonth.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

  const filteredTasks =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return tasks;
      }

      return tasks.filter(
        (task) =>
          task.title
            .toLowerCase()
            .includes(query) ||
          task.memberName
            ?.toLowerCase()
            .includes(query) ||
          ruleLabel(task.rule)
            .toLowerCase()
            .includes(query)
      );
    }, [tasks, search]);

  const selectedDayTasks =
    filteredTasks.filter(
      (task) =>
        task.date ===
        selectedDateKey
    );

  const selectedDayReminders =
    reminders.filter(
      (reminder) =>
        reminder.date ===
        selectedDateKey
    );

  const upcomingTasks =
    [...filteredTasks]
      .filter(
        (task) =>
          task.date >
          todayKey
      )
      .sort(
        (a, b) => {
          const first =
            `${a.date} ${
              a.dueDate || ""
            }`;

          const second =
            `${b.date} ${
              b.dueDate || ""
            }`;

          return first.localeCompare(
            second
          );
        }
      )
      .slice(0, 5);

  const upcomingReminders =
    [...reminders]
      .filter(
        (reminder) =>
          reminder.date >=
          todayKey
      )
      .sort(
        (a, b) => {
          const first =
            `${a.date} ${a.time}`;

          const second =
            `${b.date} ${b.time}`;

          return first.localeCompare(
            second
          );
        }
      )
      .slice(0, 5);

  /* =====================================================
     MONTH NAVIGATION
  ===================================================== */

  const goPreviousMonth =
    () => {
      setCurrentMonth(
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          1
        )
      );
    };

  const goNextMonth =
    () => {
      setCurrentMonth(
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          1
        )
      );
    };

  const goToday = () => {
    const today =
      new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDate(today);
  };

  const openReminderModal =
    (date?: Date) => {
      if (date) {
        setSelectedDate(date);
      }

      setReminderModalOpen(true);
    };

  /* =====================================================
     CREATE REMINDER
  ===================================================== */

  const handleSaveReminder =
    async (
      title: string,
      description: string,
      time: string,
      type:
        | "PERSONAL"
        | "HOUSEHOLD"
    ) => {
      try {
        setReminderSaving(true);

        /*
         * IMPORTANT:
         * Send the exact selected calendar date as
         * YYYY-MM-DD. No Date object conversion.
         */
        const reminderDate =
          dateKey(selectedDate);

        const response =
          await fetch(
            "/api/reminders",
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                title,
                description,
                date: reminderDate,
                time,
                type,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to create reminder."
          );
        }

        setReminderModalOpen(false);

        /*
         * Refresh both independently.
         * Existing notifications remain in database.
         * New reminder notification will simply appear
         * in the same notification list.
         */
        await Promise.all([
          loadReminders(),
          loadNotifications(),
        ]);
      } catch (error) {
        console.error(
          "CREATE_REMINDER_ERROR:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Unable to create reminder."
        );
      } finally {
        setReminderSaving(false);
      }
    };

  /* =====================================================
     DELETE REMINDER
  ===================================================== */

  const handleDeleteReminder =
    async () => {
      if (
        !selectedReminder ||
        reminderDeleting
      ) {
        return;
      }

      try {
        setReminderDeleting(true);

        const response =
          await fetch(
            `/api/reminders/${selectedReminder.id}`,
            {
              method: "DELETE",
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to delete reminder."
          );
        }

        setSelectedReminder(null);

        await Promise.all([
          loadReminders(),
          loadNotifications(),
        ]);
      } catch (error) {
        console.error(
          "DELETE_REMINDER_ERROR:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Unable to delete reminder."
        );
      } finally {
        setReminderDeleting(false);
      }
    };

  /* =====================================================
     REAL PROFILE
  ===================================================== */

  const profileName =
    loggedInUser?.name ||
    loggedInUser?.email ||
    "User";

  const profileRole =
    loggedInUser?.role === "OWNER"
      ? "Household Owner"
      : "Household Member";

  const profileImage =
    loggedInUser?.imageUrl ||
    loggedInUser?.image ||
    "";

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
                  className="rounded-lg p-2 text-white transition hover:bg-white/10"
                  aria-label="Close menu"
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
                    Calendar
                  </p>

                  <p className="hidden text-xs text-[#94A3B8] sm:block">
                    Plan and view household responsibilities.
                  </p>
                </div>
              </div>

              <div className="relative flex items-center gap-3">
                {/* NOTIFICATIONS */}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        (current) =>
                          !current
                      )
                    }
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
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

                    {hasUnreadNotifications && (
                      <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3B82F6] opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-[#3B82F6]" />
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl shadow-slate-900/10">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#172033]">
                              Notifications
                            </h3>

                            {unreadCount >
                              0 && (
                              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#3B82F6]">
                                {
                                  unreadCount
                                }{" "}
                                new
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-[11px] text-[#94A3B8]">
                            Household activity and reminders
                          </p>
                        </div>

                        {unreadCount >
                          0 && (
                          <button
                            type="button"
                            onClick={
                              markAllNotificationsRead
                            }
                            disabled={
                              notificationAction ===
                              "mark-all"
                            }
                            className="text-[11px] font-semibold text-[#3B82F6] transition hover:text-[#2563EB] disabled:opacity-50"
                          >
                            {notificationAction ===
                            "mark-all"
                              ? "Updating..."
                              : "Mark all read"}
                          </button>
                        )}
                      </div>

                      <div className="max-h-[430px] overflow-y-auto">
                        {notificationLoading &&
                        notifications.length ===
                          0 ? (
                          <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                            <p className="mt-3 text-xs font-medium text-[#64748B]">
                              Loading notifications...
                            </p>
                          </div>
                        ) : notifications.length ===
                          0 ? (
                          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#CBD5E1]">
                              <Bell size={25} />
                            </div>

                            <h4 className="mt-4 text-sm font-bold text-[#172033]">
                              No notifications
                            </h4>

                            <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#94A3B8]">
                              You&apos;re all caught up. New task assignments and reminders will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#E2E8F0]">
                            {notifications.map(
                              (
                                notification
                              ) => {
                                const actionIsRead =
                                  notificationAction ===
                                  `read-${notification.id}`;

                                const actionIsDelete =
                                  notificationAction ===
                                  `delete-${notification.id}`;

                                return (
                                  <div
                                    key={
                                      notification.id
                                    }
                                    className={`p-4 transition ${
                                      notification.isRead
                                        ? "bg-white"
                                        : "bg-[#EFF6FF]/45"
                                    }`}
                                  >
                                    <div className="flex gap-3">
                                      <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                          notification.isRead
                                            ? "bg-[#F8FAFC] text-[#94A3B8]"
                                            : "bg-[#EFF6FF] text-[#3B82F6]"
                                        }`}
                                      >
                                        {getNotificationIcon(
                                          notification.type
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <p
                                            className={`text-xs ${
                                              notification.isRead
                                                ? "font-medium text-[#64748B]"
                                                : "font-bold text-[#172033]"
                                            }`}
                                          >
                                            {getNotificationTitle(
                                              notification.type,
                                              notification.title ||
                                                ""
                                            )}
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

                                        <p className="mt-1.5 text-[10px] font-medium text-[#94A3B8]">
                                          {formatNotificationTime(
                                            notification.createdAt
                                          )}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleViewNotification(
                                                notification
                                              )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                                          >
                                            <Eye
                                              size={13}
                                            />

                                            View Details
                                          </button>

                                          {!notification.isRead && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                markNotificationRead(
                                                  notification.id
                                                )
                                              }
                                              disabled={
                                                actionIsRead
                                              }
                                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6] disabled:opacity-50"
                                            >
                                              <Check
                                                size={13}
                                              />

                                              {actionIsRead
                                                ? "Saving..."
                                                : "Mark as Read"}
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteNotification(
                                                notification.id
                                              )
                                            }
                                            disabled={
                                              actionIsDelete
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                                          >
                                            <Trash2
                                              size={13}
                                            />

                                            {actionIsDelete
                                              ? "Deleting..."
                                              : "Delete"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>

                      {notifications.length >
                        0 && (
                        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(
                                false
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

                {/* PROFILE */}

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 transition hover:border-blue-200 hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#EFF6FF] text-sm font-bold text-[#3B82F6]">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={profileName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(
                        profileName
                      )
                    )}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-[#172033]">
                      {profileName}
                    </p>

                    <p className="text-[11px] font-medium text-[#64748B]">
                      {profileRole}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          {/* CONTENT */}

          <div className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">
              {/* PAGE HEADER */}

              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#3B82F6]">
                    Household Schedule
                  </p>

                  <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#172033] sm:text-4xl">
                    Calendar
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                    View scheduled tasks and add reminders for
                    important household activities.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={goToday}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#172033] shadow-sm transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                  >
                    <CalendarDays size={17} />
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openReminderModal(
                        selectedDate
                      )
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2563EB]"
                  >
                    <Plus size={18} />
                    Add Reminder
                  </button>
                </div>
              </div>

              {/* SEARCH */}

              <div className="mt-7">
                <div className="relative max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search tasks..."
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* CALENDAR + SELECTED DAY */}

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
                {/* CALENDAR */}

                <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#172033]">
                        {monthName}
                      </h2>

                      <p className="mt-1 text-xs text-[#94A3B8]">
                        Select a date to view tasks and reminders.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          goPreviousMonth
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={
                          goNextMonth
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                        aria-label="Next month"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* WEEKDAYS */}

                  <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
                    {[
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ].map((day) => (
                      <div
                        key={day}
                        className="px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* DAYS */}

                  <div className="grid grid-cols-7">
                    {days.map(
                      (
                        cell,
                        index
                      ) => {
                        const key =
                          dateKey(
                            cell.date
                          );

                        const dayTasks =
                          filteredTasks.filter(
                            (task) =>
                              task.date ===
                              key
                          );

                        const dayReminders =
                          reminders.filter(
                            (reminder) =>
                              reminder.date ===
                              key
                          );

                        const isSelected =
                          key ===
                          selectedDateKey;

                        const isToday =
                          key ===
                          todayKey;

                        return (
                          <button
                            type="button"
                            key={`${key}-${index}`}
                            onClick={() =>
                              setSelectedDate(
                                cell.date
                              )
                            }
                            className={`group relative min-h-[125px] border-b border-r border-[#E2E8F0] p-2 text-left transition sm:min-h-[140px] ${
                              cell.currentMonth
                                ? "bg-white hover:bg-[#F8FAFC]"
                                : "bg-[#F8FAFC] text-[#CBD5E1]"
                            } ${
                              isSelected
                                ? "ring-2 ring-inset ring-[#3B82F6]"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                                  isToday
                                    ? "bg-[#3B82F6] text-white"
                                    : cell.currentMonth
                                    ? "text-[#334155]"
                                    : "text-[#CBD5E1]"
                                }`}
                              >
                                {cell.date.getDate()}
                              </span>

                              {(dayTasks.length >
                                0 ||
                                dayReminders.length >
                                  0) && (
                                <span className="text-[10px] font-semibold text-[#64748B]">
                                  {dayTasks.length +
                                    dayReminders.length}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              {dayTasks
                                .slice(0, 2)
                                .map(
                                  (
                                    task
                                  ) => (
                                    <div
                                      key={
                                        task.id
                                      }
                                      className={`truncate rounded-md px-1.5 py-1 text-[10px] font-semibold ${ruleClass(
                                        task.rule
                                      )}`}
                                    >
                                      {task.title}
                                    </div>
                                  )
                                )}

                              {dayReminders
                                .slice(0, 2)
                                .map(
                                  (
                                    reminder
                                  ) => (
                                    <div
                                      key={
                                        reminder.id
                                      }
                                      className="flex items-center gap-1 truncate rounded-md bg-purple-50 px-1.5 py-1 text-[10px] font-semibold text-purple-700"
                                    >
                                      <Bell
                                        size={10}
                                        className="shrink-0"
                                      />

                                      <span className="truncate">
                                        {
                                          reminder.title
                                        }
                                      </span>
                                    </div>
                                  )
                                )}

                              {dayTasks.length +
                                dayReminders.length >
                                4 && (
                                <p className="px-1 text-[10px] font-semibold text-[#64748B]">
                                  +
                                  {dayTasks.length +
                                    dayReminders.length -
                                    4}{" "}
                                  more
                                </p>
                              )}
                            </div>

                            <span
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                openReminderModal(
                                  cell.date
                                );
                              }}
                              className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#94A3B8] opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                              title="Add reminder"
                            >
                              <Plus size={13} />
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* LEGEND */}

                  <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[#E2E8F0] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />

                      <span className="text-xs text-[#64748B]">
                        Temporary
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

                      <span className="text-xs text-[#64748B]">
                        Recurring
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />

                      <span className="text-xs text-[#64748B]">
                        Permanent
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-700" />

                      <span className="text-xs text-[#64748B]">
                        Reminder
                      </span>
                    </div>
                  </div>
                </section>

                {/* SELECTED DATE */}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                          Selected Date
                        </p>

                        <h2 className="mt-2 text-lg font-bold text-[#172033]">
                          {formatDate(
                            selectedDateKey
                          )}
                        </h2>

                        <p className="mt-1 text-xs text-[#94A3B8]">
                          {selectedDayTasks.length +
                            selectedDayReminders.length}{" "}
                          item
                          {selectedDayTasks.length +
                            selectedDayReminders.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          scheduled
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openReminderModal(
                            selectedDate
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6] transition hover:bg-blue-100"
                        title="Add reminder"
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>

                  {loadingTasks ||
                  loadingReminders ? (
                    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#3B82F6]">
                        <CalendarDays size={25} />
                      </div>

                      <h3 className="mt-4 text-sm font-bold text-[#172033]">
                        Loading calendar...
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-[#64748B]">
                        Loading your scheduled responsibilities.
                      </p>
                    </div>
                  ) : selectedDayTasks.length ===
                      0 &&
                    selectedDayReminders.length ===
                      0 ? (
                    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#3B82F6]">
                        <CalendarDays size={25} />
                      </div>

                      <h3 className="mt-4 text-sm font-bold text-[#172033]">
                        Nothing scheduled
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-[#64748B]">
                        Add a reminder or your assigned tasks will
                        appear here.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openReminderModal(
                            selectedDate
                          )
                        }
                        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
                      >
                        <Plus size={16} />
                        Add Reminder
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E2E8F0]">
                      {selectedDayReminders.map(
                        (reminder) => (
                          <button
                            type="button"
                            key={reminder.id}
                            onClick={() =>
                              setSelectedReminder(
                                reminder
                              )
                            }
                            className="w-full p-4 text-left transition hover:bg-[#FAF7FF]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                <Bell size={16} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#172033]">
                                  {reminder.title}
                                </p>

                                <div className="mt-1 flex items-center gap-2">
                                  <Clock3
                                    size={13}
                                    className="text-[#94A3B8]"
                                  />

                                  <span className="text-xs text-[#64748B]">
                                    {reminder.time}
                                  </span>

                                  <span className="text-[#CBD5E1]">
                                    •
                                  </span>

                                  <span className="text-xs text-purple-600">
                                    {reminder.type ===
                                    "PERSONAL"
                                      ? "Personal"
                                      : "Household"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      )}

                      {selectedDayTasks.map(
                        (task) => (
                          <div
                            key={task.id}
                            className="p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#3B82F6]">
                                <CheckCircle2 size={16} />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#172033]">
                                  {task.title}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${ruleClass(
                                      task.rule
                                    )}`}
                                  >
                                    {ruleLabel(
                                      task.rule
                                    )}
                                  </span>

                                  <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(
                                      task.status
                                    )}`}
                                  >
                                    {statusLabel(
                                      task.status
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* UPCOMING REMINDERS */}

              <section className="mt-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#172033]">
                      Upcoming Reminders
                    </h2>

                    <p className="mt-1 text-sm text-[#64748B]">
                      Personal and household reminders coming up.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openReminderModal(
                        selectedDate
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] px-4 text-sm font-semibold text-[#172033] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                  >
                    <Plus size={16} />
                    Add Reminder
                  </button>
                </div>

                {upcomingReminders.length ===
                0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Bell size={24} />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#172033]">
                      No reminders yet
                    </h3>

                    <p className="mt-2 max-w-md text-xs leading-5 text-[#64748B]">
                      Add reminders for groceries, bills,
                      appointments, cleaning, or anything important.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openReminderModal(
                          selectedDate
                        )
                      }
                      className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
                    >
                      <Plus size={16} />
                      Create Reminder
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {upcomingReminders.map(
                      (reminder) => (
                        <button
                          type="button"
                          key={reminder.id}
                          onClick={() =>
                            setSelectedReminder(
                              reminder
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-[#FAF7FF] sm:p-6"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                              <Bell size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#172033]">
                                {reminder.title}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-[#64748B]">
                                  {formatDate(
                                    reminder.date
                                  )}
                                </span>

                                <span className="text-[#CBD5E1]">
                                  •
                                </span>

                                <span className="text-xs font-semibold text-purple-600">
                                  {reminder.time}
                                </span>

                                <span className="text-[#CBD5E1]">
                                  •
                                </span>

                                <span className="text-xs text-[#64748B]">
                                  {reminder.type ===
                                  "PERSONAL"
                                    ? "Personal"
                                    : "Household"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight
                            size={17}
                            className="shrink-0 text-[#94A3B8]"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* UPCOMING TASKS */}

              <section className="mt-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="border-b border-[#E2E8F0] p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-[#172033]">
                    Upcoming Tasks
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    Your next scheduled household responsibilities.
                  </p>
                </div>

                {upcomingTasks.length ===
                0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#64748B]">
                      <CalendarDays size={25} />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#172033]">
                      No upcoming tasks
                    </h3>

                    <p className="mt-2 max-w-md text-xs leading-5 text-[#64748B]">
                      Once your tasks are created and scheduled,
                      your next responsibilities will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {upcomingTasks.map(
                      (task) => (
                        <div
                          key={task.id}
                          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                              <CalendarDays size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#172033]">
                                {task.title}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-[#64748B]">
                                  {formatDate(
                                    task.date
                                  )}
                                </span>

                                <span className="text-[#CBD5E1]">
                                  •
                                </span>

                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${ruleClass(
                                    task.rule
                                  )}`}
                                >
                                  {ruleLabel(
                                    task.rule
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* INFO */}

              <section className="mt-6 rounded-2xl border border-blue-100 bg-[#EFF6FF] p-5 sm:p-6">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#3B82F6] shadow-sm">
                    <Bell size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">
                      Never forget an important activity
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748B]">
                      Add personal or household reminders directly
                      from the calendar. Personal reminders stay
                      private, while household reminders are shared
                      with your household members.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

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
                    Share the work. Balance the home.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#64748B]">
                © {new Date().getFullYear()} HomeSync. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* ADD REMINDER MODAL */}

      {reminderModalOpen && (
        <ReminderModal
          selectedDate={selectedDate}
          onClose={() =>
            setReminderModalOpen(false)
          }
          onSave={handleSaveReminder}
          saving={reminderSaving}
        />
      )}

      {/* REMINDER DETAILS MODAL */}

      {selectedReminder && (
        <ReminderDetailsModal
          reminder={selectedReminder}
          onClose={() =>
            setSelectedReminder(null)
          }
          onDelete={handleDeleteReminder}
          deleting={reminderDeleting}
        />
      )}
    </main>
  );
}