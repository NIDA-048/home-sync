"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Home,
  ListChecks,
  Loader2,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";

type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "TASK_COMPLETED"
  | "TASK_REASSIGNED"
  | "FEEDBACK_ACTIVITY"
  | "GENERAL";

type NotificationItem = {
  id: string;
  userId: string;
  householdId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: string | null;
  relatedFeedbackId?: string | null;
  createdAt: string;
};

type UserData = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string | null;
  role?: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
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
    <Link
      href="/dashboard"
      className="flex items-center gap-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6] text-white shadow-sm">
        <Home
          size={21}
          strokeWidth={2.2}
        />
      </div>

      <p className="text-base font-bold text-white">
        HomeSync
      </p>
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

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() =>
                setMobileOpen?.(false)
              }
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:text-white"
            >
              <Icon
                size={19}
                strokeWidth={2}
              />

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

      <SidebarLinks
        setMobileOpen={setMobileOpen}
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

function formatDate(date: string) {
  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getNotificationIcon(
  type: NotificationType
) {
  switch (type) {
    case "FEEDBACK_ACTIVITY":
      return MessageSquare;

    case "TASK_ASSIGNED":
      return ListChecks;

    case "TASK_COMPLETED":
      return CheckCheck;

    case "TASK_REASSIGNED":
      return Users;

    case "TASK_DUE_SOON":
      return CalendarDays;

    default:
      return Bell;
  }
}

function getDetailsLabel(
  type: NotificationType
) {
  switch (type) {
    case "FEEDBACK_ACTIVITY":
      return "View Feedback";

    case "TASK_ASSIGNED":
    case "TASK_COMPLETED":
    case "TASK_REASSIGNED":
      return "View Task";

    case "TASK_DUE_SOON":
      return "View Calendar";

    default:
      return "View Details";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<
    "ALL" | "UNREAD" | "READ"
  >("ALL");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [user, setUser] =
    useState<UserData | null>(null);

  const [markingId, setMarkingId] =
    useState<string | null>(null);

  const [markingAll, setMarkingAll] =
    useState(false);

  const loadNotifications = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await fetch(
          "/api/notifications",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load notifications."
          );
        }

        const notificationList = Array.isArray(
          data?.notifications
        )
          ? data.notifications
          : Array.isArray(data)
            ? data
            : [];

        setNotifications(
          notificationList
        );

        setError("");
      } catch (error) {
        console.error(
          "LOAD_NOTIFICATIONS_ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load notifications."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("homesync-user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error(
        "LOAD_USER_ERROR:",
        error
      );
    }

    loadNotifications(true);

    const interval = setInterval(() => {
      loadNotifications(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.isRead
      ).length,
    [notifications]
  );

  const readCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.isRead
      ).length,
    [notifications]
  );

  const filteredNotifications =
    useMemo(() => {
      if (filter === "UNREAD") {
        return notifications.filter(
          (notification) =>
            !notification.isRead
        );
      }

      if (filter === "READ") {
        return notifications.filter(
          (notification) =>
            notification.isRead
        );
      }

      return notifications;
    }, [notifications, filter]);

  const markAsRead = async (
    notificationId: string
  ) => {
    try {
      setMarkingId(notificationId);

      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            notificationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "MARK_AS_READ_ERROR:",
        error
      );
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);

      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            markAllRead: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to mark all notifications as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "MARK_ALL_AS_READ_ERROR:",
        error
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleViewDetails = (
    notification: NotificationItem
  ) => {
    // Feedback notification
    if (
      notification.type ===
      "FEEDBACK_ACTIVITY"
    ) {
      window.location.href =
        "/dashboard/feedback";
      return;
    }

    // Reminder notification
    if (
      notification.type ===
        "TASK_DUE_SOON" ||
      notification.title ===
        "Personal Reminder"
    ) {
      window.location.href =
        "/dashboard/calendar";
      return;
    }

    // Task notifications
    if (
      notification.type ===
        "TASK_ASSIGNED" ||
      notification.type ===
        "TASK_COMPLETED" ||
      notification.type ===
        "TASK_REASSIGNED"
    ) {
      window.location.href =
        "/dashboard/tasks";
      return;
    }
  };

  const role =
    user?.role === "OWNER"
      ? "Household Owner"
      : "Household Member";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#172033] lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() =>
              setMobileOpen(false)
            }
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#172033] lg:hidden">
            <div className="flex h-full flex-col">
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
                setMobileOpen={setMobileOpen}
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
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        {/* Navbar */}
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(true)
              }
              className="rounded-lg p-2 text-[#172033] hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-[#172033]">
                Notifications
              </p>

              <p className="text-xs text-[#64748B]">
                Stay updated with your household activity
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#172033] transition hover:border-[#3B82F6] hover:text-[#3B82F6] sm:flex"
              >
                <ArrowLeft size={16} />
                Dashboard
              </Link>

              <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={
                      user.name ||
                      "Profile"
                    }
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-bold text-[#2563EB]">
                    {(
                      user?.name ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-[#172033]">
                    {user?.name ||
                      "User"}
                  </p>

                  <p className="text-[11px] text-[#64748B]">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#64748B] transition hover:text-[#3B82F6]"
              >
                <ArrowLeft size={17} />
                Back to Dashboard
              </Link>

              <h1 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-[#64748B]">
                Keep track of important household activity.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#25324A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {markingAll ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCheck size={17} />
                )}

                {markingAll
                  ? "Marking..."
                  : "Mark all as read"}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Total Notifications
              </p>

              <p className="mt-2 text-3xl font-bold text-[#172033]">
                {notifications.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Unread
              </p>

              <p className="mt-2 text-3xl font-bold text-[#3B82F6]">
                {unreadCount}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Read
              </p>

              <p className="mt-2 text-3xl font-bold text-[#172033]">
                {readCount}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setFilter("ALL")
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === "ALL"
                  ? "bg-[#3B82F6] text-white"
                  : "border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("UNREAD")
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === "UNREAD"
                  ? "bg-[#3B82F6] text-white"
                  : "border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50"
              }`}
            >
              Unread
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("READ")
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === "READ"
                  ? "bg-[#3B82F6] text-white"
                  : "border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50"
              }`}
            >
              Read
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Notifications */}
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
              <div className="flex items-center gap-3 text-sm font-medium text-[#64748B]">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading notifications...
              </div>
            </div>
          ) : filteredNotifications.length ===
            0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-[#3B82F6]">
                <Bell size={25} />
              </div>

              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                No notifications
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                You do not have any notifications in this category.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(
                (notification) => {
                  const Icon =
                    getNotificationIcon(
                      notification.type
                    );

                  return (
                    <div
                      key={notification.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                        notification.isRead
                          ? "border-[#E2E8F0]"
                          : "border-blue-200 bg-blue-50/30"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            notification.isRead
                              ? "bg-slate-100 text-[#64748B]"
                              : "bg-[#DBEAFE] text-[#2563EB]"
                          }`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-[#172033]">
                                  {
                                    notification.title
                                  }
                                </h3>

                                {!notification.isRead && (
                                  <span className="rounded-full bg-[#3B82F6] px-2 py-0.5 text-[10px] font-bold text-white">
                                    NEW
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#94A3B8]">
                                <Clock3
                                  size={13}
                                />
                                {formatDate(
                                  notification.createdAt
                                )}
                              </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {(notification.type !==
                                "GENERAL" ||
                                notification.title ===
                                  "Personal Reminder") && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewDetails(
                                      notification
                                    )
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-bold text-[#172033] transition hover:border-[#3B82F6] hover:text-[#3B82F6]"
                                >
                                  {getDetailsLabel(
                                    notification.type
                                  )}

                                  <ChevronRight
                                    size={15}
                                  />
                                </button>
                              )}

                              {!notification.isRead && (
                                <button
                                  type="button"
                                  disabled={
                                    markingId ===
                                    notification.id
                                  }
                                  onClick={() =>
                                    markAsRead(
                                      notification.id
                                    )
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {markingId ===
                                  notification.id ? (
                                    <>
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                      Marking...
                                    </>
                                  ) : (
                                    <>
                                      <Check
                                        size={14}
                                      />
                                      Mark as Read
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </main>

        {/* Footer */}
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
  );
}