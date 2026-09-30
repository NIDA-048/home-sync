"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Eye,
  Home,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  Reply,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";

type FeedbackCategory =
  | "Household"
  | "Tasks"
  | "Fairness"
  | "Suggestions"
  | "Other";

type FeedbackStatus =
  | "NEW"
  | "REVIEWED";

type FeedbackItem = {
  id: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
  status: FeedbackStatus;
};

type FeedbackReply = {
  id: string;
  message: string;
  createdAt: string;
};

type UserData = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string | null;
  image?: string | null;
};

type NotificationItem = {
  id: string;
  type: string;
  title?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedTaskId?: string | null;
};

type HouseholdRole =
  | "OWNER"
  | "MEMBER";

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

const categories: FeedbackCategory[] = [
  "Household",
  "Tasks",
  "Fairness",
  "Suggestions",
  "Other",
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function formatNotificationTime(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function getNotificationTitle(
  type: string,
  title: string,
) {
  if (title.trim()) {
    return title;
  }

  switch (type) {
    case "TASK_ASSIGNED":
      return "New Task Assigned";

    case "TASK_REMINDER":
      return "Task Reminder";

    case "FEEDBACK":
      return "New Feedback";

    case "TASK_COMPLETED":
      return "Task Completed";

    default:
      return "Notification";
  }
}

function getNotificationIcon(
  type: string,
) {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_REMINDER":
    case "TASK_COMPLETED":
    case "FEEDBACK":
    default:
      return <Bell size={16} />;
  }
}

function getCategoryClasses(
  category: FeedbackCategory,
) {
  switch (category) {
    case "Household":
      return "bg-blue-50 text-blue-600";

    case "Tasks":
      return "bg-indigo-50 text-indigo-600";

    case "Fairness":
      return "bg-purple-50 text-purple-600";

    case "Suggestions":
      return "bg-emerald-50 text-emerald-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* ---------------------------------------------
   LOGO
--------------------------------------------- */

function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
        <Home
          size={21}
          strokeWidth={2.2}
        />
      </div>

      <span className="text-xl font-bold tracking-[-0.03em] text-white">
        HomeSync
      </span>
    </Link>
  );
}

/* ---------------------------------------------
   SIDEBAR
--------------------------------------------- */

function SidebarLinks({
  setMobileOpen,
}: {
  setMobileOpen?: (
    value: boolean,
  ) => void;
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
            item.href ===
            "/dashboard/feedback";

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() =>
                setMobileOpen?.(
                  false,
                )
              }
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={2}
              />

              <span>
                {item.label}
              </span>
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
  setMobileOpen?: (
    value: boolean,
  ) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <SidebarLinks
        setMobileOpen={
          setMobileOpen
        }
      />

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

/* ---------------------------------------------
   PAGE
--------------------------------------------- */

export default function FeedbackPage() {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackItem[]>([]);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [currentUser, setCurrentUser] =
    useState<UserData | null>(null);

  const [householdRole, setHouseholdRole] =
    useState<HouseholdRole>("MEMBER");

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackItem | null>(null);

  const [replies, setReplies] =
    useState<FeedbackReply[]>([]);

  const [replyText, setReplyText] =
    useState("");

  const [replyLoading, setReplyLoading] =
    useState(false);

  const [repliesLoading, setRepliesLoading] =
    useState(false);

  const [category, setCategory] =
    useState<FeedbackCategory>(
      "Household",
    );

  const [message, setMessage] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const [notificationAction, setNotificationAction] =
    useState<string | null>(null);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "homesync-user",
        );

      if (stored) {
        const parsed =
          JSON.parse(stored);

        const user =
          parsed?.user || parsed;

        setCurrentUser({
          id: user?.id,
          name: user?.name,
          email: user?.email,
          imageUrl:
            user?.imageUrl ||
            user?.image ||
            null,
          image:
            user?.image ||
            user?.imageUrl ||
            null,
        });
      }

      const householdStored =
        localStorage.getItem(
          "homesync-household",
        );

      if (householdStored) {
        const household =
          JSON.parse(
            householdStored,
          );

        const role =
          household?.myRole ||
          household?.role ||
          household?.household?.myRole;

        if (
          role === "OWNER" ||
          role === "MEMBER"
        ) {
          setHouseholdRole(
            role,
          );
        }
      }
    } catch {
      setCurrentUser(null);
    }

    loadHouseholdRole();
    loadFeedback();
    loadNotifications();

    const interval =
      window.setInterval(
        loadNotifications,
        15000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const feedbackId =
      params.get("feedbackId");

    if (
      feedbackId &&
      feedback.length > 0
    ) {
      const item =
        feedback.find(
          (feedbackItem) =>
            feedbackItem.id ===
            feedbackId,
        );

      if (item) {
        openDetails(item);
      }
    }
  }, [feedback]);

  async function loadHouseholdRole() {
    try {
      const response =
        await fetch(
          "/api/auth/household/current",
          {
            credentials: "include",
            cache: "no-store",
          },
        );

      if (!response.ok) return;

      const data =
        await response.json();

      const role =
        data?.household?.myRole;

      if (
        role === "OWNER" ||
        role === "MEMBER"
      ) {
        setHouseholdRole(
          role,
        );
      }

      if (
        data?.household
      ) {
        localStorage.setItem(
          "homesync-household",
          JSON.stringify(
            data.household,
          ),
        );
      }
    } catch (err) {
      console.error(
        "HOUSEHOLD_ROLE_ERROR:",
        err,
      );
    }
  }

  async function loadFeedback() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/feedback",
          {
            credentials: "include",
            cache: "no-store",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load feedback.",
        );
      }

      const list =
        Array.isArray(data)
          ? data
          : data?.feedback || [];

      const normalized: FeedbackItem[] =
        [];

      for (const item of list) {
        if (!item?.id) continue;

        const rawCategory =
          String(
            item.category ||
              "OTHER",
          ).toUpperCase();

        let feedbackCategory:
          FeedbackCategory =
          "Other";

        if (
          rawCategory ===
          "HOUSEHOLD"
        ) {
          feedbackCategory =
            "Household";
        } else if (
          rawCategory ===
          "TASKS"
        ) {
          feedbackCategory =
            "Tasks";
        } else if (
          rawCategory ===
          "FAIRNESS"
        ) {
          feedbackCategory =
            "Fairness";
        } else if (
          rawCategory ===
          "SUGGESTIONS"
        ) {
          feedbackCategory =
            "Suggestions";
        }

        normalized.push({
          id: String(item.id),
          category:
            feedbackCategory,
          message: String(
            item.message || "",
          ),
          createdAt: String(
            item.createdAt ||
              new Date().toISOString(),
          ),
          status:
            String(
              item.status || "NEW",
            ).toUpperCase() ===
            "REVIEWED"
              ? "REVIEWED"
              : "NEW",
        });
      }

      setFeedback(
        normalized,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load feedback.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      setNotificationLoading(true);

      const response =
        await fetch(
          "/api/notifications",
          {
            credentials: "include",
            cache: "no-store",
          },
        );

      if (!response.ok) return;

      const data =
        await response.json();

      const list =
        Array.isArray(data)
          ? data
          : data?.notifications ||
            data?.items ||
            [];

      const normalized: NotificationItem[] =
        [];

      for (const item of list) {
        if (!item?.id) continue;

        normalized.push({
          id: String(item.id),
          type: String(
            item.type ||
              "GENERAL",
          ),
          title:
            item.title
              ? String(item.title)
              : "",
          message: String(
            item.message ||
              "You have a new notification.",
          ),
          isRead: Boolean(
            item.isRead,
          ),
          createdAt: String(
            item.createdAt ||
              new Date().toISOString(),
          ),
          relatedTaskId:
            item.relatedTaskId !=
            null
              ? String(
                  item.relatedTaskId,
                )
              : null,
        });
      }

      setNotifications(
        normalized,
      );
    } catch (err) {
      console.error(
        "NOTIFICATION_ERROR:",
        err,
      );
    } finally {
      setNotificationLoading(false);
    }
  }

  async function markNotificationRead(
    notificationId: string,
  ) {
    try {
      setNotificationAction(
        `read-${notificationId}`,
      );

      const response =
        await fetch(
          "/api/notifications",
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              notificationId,
              isRead: true,
            }),
          },
        );

      if (!response.ok) {
        throw new Error(
          "Unable to update notification.",
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,
                    isRead: true,
                  }
                : item,
          ),
      );
    } catch (err) {
      console.error(
        "MARK_NOTIFICATION_READ_ERROR:",
        err,
      );
    } finally {
      setNotificationAction(
        null,
      );
    }
  }

  async function markAllNotificationsRead() {
    try {
      setNotificationAction(
        "mark-all",
      );

      const response =
        await fetch(
          "/api/notifications",
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              markAllRead: true,
            }),
          },
        );

      if (!response.ok) {
        throw new Error(
          "Unable to update notifications.",
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              isRead: true,
            }),
          ),
      );
    } catch (err) {
      console.error(
        "MARK_ALL_NOTIFICATIONS_ERROR:",
        err,
      );
    } finally {
      setNotificationAction(
        null,
      );
    }
  }

  async function deleteNotification(
    notificationId: string,
  ) {
    const confirmed =
      window.confirm(
        "Delete this notification?",
      );

    if (!confirmed) return;

    try {
      setNotificationAction(
        `delete-${notificationId}`,
      );

      const response =
        await fetch(
          `/api/notifications/${encodeURIComponent(
            notificationId,
          )}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.message ||
            "Unable to delete notification.",
        );
      }

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              notificationId,
          ),
      );
    } catch (err) {
      console.error(
        "DELETE_NOTIFICATION_ERROR:",
        err,
      );
    } finally {
      setNotificationAction(
        null,
      );
    }
  }

  function handleViewNotification(
    notification: NotificationItem,
  ) {
    if (!notification.isRead) {
      void markNotificationRead(
        notification.id,
      );
    }

    setNotificationsOpen(
      false,
    );

    if (
      notification.relatedTaskId
    ) {
      window.location.href =
        `/dashboard/tasks?taskId=${encodeURIComponent(
          notification.relatedTaskId,
        )}`;

      return;
    }

    window.location.href =
      "/dashboard/notifications";
  }

  async function submitFeedback() {
    if (!message.trim()) {
      setError(
        "Please enter your feedback.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response =
        await fetch(
          "/api/feedback",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              category,
              message:
                message.trim(),
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to submit feedback.",
        );
      }

      setMessage("");
      setCategory("Household");
      setModalOpen(false);

      setSuccess(
        "Feedback submitted successfully.",
      );

      await loadFeedback();
      await loadNotifications();

      setTimeout(
        () => setSuccess(""),
        3000,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openDetails(
    item: FeedbackItem,
  ) {
    setSelectedFeedback(item);
    setDetailOpen(true);
    setReplies([]);
    setReplyText("");

    try {
      setRepliesLoading(true);

      const response =
        await fetch(
          `/api/feedback/${item.id}/replies`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

      const data =
        await response.json();

      if (response.ok) {
        setReplies(
          Array.isArray(
            data?.replies,
          )
            ? data.replies
            : [],
        );
      }
    } catch (err) {
      console.error(
        "LOAD_REPLIES_ERROR:",
        err,
      );
    } finally {
      setRepliesLoading(false);
    }
  }

  async function submitReply() {
    if (
      !selectedFeedback ||
      !replyText.trim()
    ) {
      return;
    }

    try {
      setReplyLoading(true);

      const response =
        await fetch(
          `/api/feedback/${selectedFeedback.id}/replies`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message:
                replyText.trim(),
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to submit reply.",
        );
      }

      setReplyText("");

      setReplies(
        (current) => [
          ...current,
          data.reply,
        ],
      );

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit reply.",
      );
    } finally {
      setReplyLoading(false);
    }
  }

  const unreadCount =
    notifications.filter(
      (item) => !item.isRead,
    ).length;

  const hasUnreadNotifications =
    notifications.some(
      (item) => !item.isRead,
    );

  const filteredFeedback =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) return feedback;

      return feedback.filter(
        (item) =>
          item.message
            .toLowerCase()
            .includes(query) ||
          item.category
            .toLowerCase()
            .includes(query),
      );
    }, [
      feedback,
      search,
    ]);

  const profileName =
    currentUser?.name ||
    "Nida";

  const profileRole =
    householdRole === "OWNER"
      ? "Household Owner"
      : "Household Member";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      <div className="flex min-h-screen">

        {/* =========================================
            SIDEBAR
        ========================================== */}

        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#172033] lg:block">
          <SidebarContent />
        </aside>

        {/* =========================================
            MOBILE SIDEBAR
        ========================================== */}

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() =>
                setMobileOpen(false)
              }
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#172033] lg:hidden">
              <SidebarContent
                setMobileOpen={
                  setMobileOpen
                }
              />

              <button
                type="button"
                onClick={() =>
                  setMobileOpen(false)
                }
                className="absolute right-5 top-5 rounded-lg p-1 text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={21} />
              </button>
            </aside>
          </>
        )}

        {/* =========================================
            MAIN
        ========================================== */}

        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">

          {/* =========================================
              NAVBAR
          ========================================== */}

          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
            <div className="flex h-20 items-center justify-between px-5 sm:px-8">

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(true)
                  }
                  className="rounded-xl border border-[#E2E8F0] p-2 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <p className="text-sm font-semibold text-[#172033]">
                    Feedback
                  </p>

                  <p className="text-xs text-[#94A3B8]">
                    Anonymous household feedback
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                {/* =========================================
                    NOTIFICATION
                ========================================== */}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        (current) =>
                          !current,
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

                            {unreadCount > 0 && (
                              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#3B82F6]">
                                {unreadCount}{" "}
                                new
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-[11px] text-[#94A3B8]">
                            Household activity and reminders
                          </p>
                        </div>

                        {unreadCount > 0 && (
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
                              <Bell
                                size={25}
                              />
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
                                notification,
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
                                          notification.type,
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
                                                "",
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
                                                  notification.id,
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
                                                notification.id,
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
                              },
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

                {/* =========================================
                    PROFILE
                ========================================== */}

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 transition hover:border-blue-200 hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#EFF6FF] text-sm font-bold text-[#3B82F6]">
                    {currentUser?.imageUrl ||
                    currentUser?.image ? (
                      <img
                        src={
                          currentUser.imageUrl ||
                          currentUser.image ||
                          ""
                        }
                        alt={
                          profileName
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profileName
                        .charAt(0)
                        .toUpperCase()
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

          {/* =========================================
              CONTENT
          ========================================== */}

          <div className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">

              {success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              {error && (
                <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <span>
                    {error}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setError("")
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* =========================================
                  HEADER
              ========================================== */}

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#3B82F6]">
                    Anonymous Suggestions
                  </p>

                  <h1 className="mt-1 text-3xl font-bold text-[#172033]">
                    Household Feedback
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                    Share thoughts about household tasks,
                    fairness, and improvements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(true)
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
                >
                  <Plus size={18} />
                  Give Feedback
                </button>
              </div>

              {/* =========================================
                  STATS
              ========================================== */}

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <p className="text-sm text-[#64748B]">
                    Total Feedback
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#172033]">
                    {feedback.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <p className="text-sm text-[#64748B]">
                    New
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#3B82F6]">
                    {
                      feedback.filter(
                        (item) =>
                          item.status ===
                          "NEW",
                      ).length
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <p className="text-sm text-[#64748B]">
                    Unread Notifications
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#EF4444]">
                    {unreadCount}
                  </p>
                </div>
              </div>

              {/* =========================================
                  FEEDBACK LIST
              ========================================== */}

              <section className="mt-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#172033]">
                      Recent Feedback
                    </h2>

                    <p className="mt-1 text-sm text-[#64748B]">
                      Feedback is displayed anonymously.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value,
                        )
                      }
                      placeholder="Search feedback..."
                      className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <Loader2
                      className="animate-spin text-[#3B82F6]"
                      size={30}
                    />
                  </div>
                ) : filteredFeedback.length ===
                  0 ? (
                  <div className="px-6 py-20 text-center">
                    <MessageSquare
                      className="mx-auto text-[#94A3B8]"
                      size={40}
                    />

                    <p className="mt-4 font-semibold text-[#172033]">
                      No feedback found
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {filteredFeedback.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="p-5 transition hover:bg-[#F8FAFC] sm:p-6"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                                <MessageSquare
                                  size={19}
                                />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getCategoryClasses(
                                      item.category,
                                    )}`}
                                  >
                                    {
                                      item.category
                                    }
                                  </span>

                                  {item.status ===
                                    "NEW" && (
                                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#3B82F6]">
                                      New
                                    </span>
                                  )}
                                </div>

                                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#475569]">
                                  {
                                    item.message
                                  }
                                </p>

                                <p className="mt-2 text-xs text-[#94A3B8]">
                                  Anonymous member •{" "}
                                  {formatDate(
                                    item.createdAt,
                                  )}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openDetails(
                                  item,
                                )
                              }
                              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 text-xs font-bold text-[#2563EB] transition hover:bg-[#DBEAFE]"
                            >
                              <MessageSquare
                                size={15}
                              />
                              View Details
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              {/* =========================================
                  INFO
              ========================================== */}

              <section className="mt-6 rounded-2xl border border-blue-100 bg-[#EFF6FF] p-5">
                <div className="flex gap-3">
                  <MessageSquare
                    className="mt-0.5 shrink-0 text-[#3B82F6]"
                    size={20}
                  />

                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">
                      Your feedback is anonymous
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#64748B]">
                      Other members can see the feedback and replies,
                      but member names are not displayed.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* =========================================
              FOOTER
          ========================================== */}

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
                ©{" "}
                {new Date().getFullYear()}{" "}
                HomeSync. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* =========================================
          GIVE FEEDBACK MODAL
      ========================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172033]/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
              <div>
                <h2 className="font-bold text-[#172033]">
                  Give Feedback
                </h2>

                <p className="mt-1 text-xs text-[#64748B]">
                  Your identity will remain hidden.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172033]">
                  Category
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {categories.map(
                    (item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() =>
                          setCategory(
                            item,
                          )
                        }
                        className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${
                          category ===
                          item
                            ? "border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]"
                            : "border-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <label className="text-sm font-semibold text-[#172033]">
                    Feedback
                  </label>

                  <span className="text-xs text-[#94A3B8]">
                    {message.length}/1000
                  </span>
                </div>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value,
                    )
                  }
                  maxLength={1000}
                  rows={6}
                  placeholder="Write your feedback..."
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  className="rounded-xl border border-[#E2E8F0] px-5 py-2.5 text-sm font-semibold text-[#64748B]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    submitFeedback
                  }
                  disabled={
                    submitting ||
                    !message.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          DETAILS + REPLY MODAL
      ========================================== */}

      {detailOpen &&
        selectedFeedback && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#172033]/60 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getCategoryClasses(
                        selectedFeedback.category,
                      )}`}
                    >
                      {
                        selectedFeedback.category
                      }
                    </span>

                    <span className="text-xs text-[#94A3B8]">
                      {formatDate(
                        selectedFeedback.createdAt,
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-bold text-[#172033]">
                    Feedback Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDetailOpen(
                      false,
                    );

                    router.replace(
                      "/dashboard/feedback",
                    );
                  }}
                  className="rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-5 sm:p-6">

                {/* FEEDBACK */}

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      size={17}
                      className="text-[#3B82F6]"
                    />

                    <span className="text-xs font-bold text-[#64748B]">
                      Anonymous Feedback
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#334155]">
                    {
                      selectedFeedback.message
                    }
                  </p>
                </div>

                {/* REPLIES */}

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#172033]">
                      Replies
                    </h3>

                    <span className="text-xs text-[#94A3B8]">
                      {replies.length}{" "}
                      {replies.length ===
                      1
                        ? "reply"
                        : "replies"}
                    </span>
                  </div>

                  {repliesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2
                        size={22}
                        className="animate-spin text-[#3B82F6]"
                      />
                    </div>
                  ) : replies.length ===
                    0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-[#CBD5E1] px-4 py-8 text-center">
                      <Reply
                        size={22}
                        className="mx-auto text-[#94A3B8]"
                      />

                      <p className="mt-2 text-sm font-semibold text-[#475569]">
                        No replies yet
                      </p>

                      <p className="mt-1 text-xs text-[#94A3B8]">
                        Be the first household member to reply.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {replies.map(
                        (reply) => (
                          <div
                            key={
                              reply.id
                            }
                            className="rounded-xl border border-[#E2E8F0] bg-white p-4"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#3B82F6]">
                                <Users
                                  size={15}
                                />
                              </div>

                              <div>
                                <p className="text-xs font-bold text-[#172033]">
                                  Household Member
                                </p>

                                <p className="text-[10px] text-[#94A3B8]">
                                  {formatDate(
                                    reply.createdAt,
                                  )}
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
                              {
                                reply.message
                              }
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {/* REPLY INPUT */}

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-[#172033]">
                      Reply
                    </label>

                    <textarea
                      value={
                        replyText
                      }
                      onChange={(
                        e,
                      ) =>
                        setReplyText(
                          e.target.value,
                        )
                      }
                      maxLength={
                        1000
                      }
                      rows={4}
                      placeholder="Write a reply..."
                      className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={
                          submitReply
                        }
                        disabled={
                          replyLoading ||
                          !replyText.trim()
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {replyLoading ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Reply
                            size={16}
                          />
                        )}

                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}