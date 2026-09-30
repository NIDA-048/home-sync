"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Home,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  User,
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
  image?: string | null;
  role?: string;
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
    icon: SettingsIcon,
  },
];

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
            "/dashboard/settings";

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
   SECTION HEADER
--------------------------------------------- */

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="text-base font-bold text-[#172033]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-5 text-[#64748B]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   TOGGLE
--------------------------------------------- */

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={enabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        enabled
          ? "bg-[#3B82F6]"
          : "bg-[#CBD5E1]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

/* ---------------------------------------------
   NOTIFICATION HELPERS
--------------------------------------------- */

function formatDate(
  date: string,
) {
  const value = new Date(date);

  if (
    Number.isNaN(
      value.getTime(),
    )
  ) {
    return "";
  }

  return value.toLocaleString(
    [],
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function getNotificationIcon(
  type: NotificationType,
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

function getNotificationTitle(
  type: NotificationType,
  title: string,
) {
  if (title.trim()) {
    return title;
  }

  switch (type) {
    case "TASK_ASSIGNED":
      return "New Task Assigned";

    case "TASK_DUE_SOON":
      return "Task Reminder";

    case "TASK_COMPLETED":
      return "Task Completed";

    case "TASK_REASSIGNED":
      return "Task Reassigned";

    case "FEEDBACK_ACTIVITY":
      return "Feedback Activity";

    default:
      return "Notification";
  }
}

function getDetailsLabel(
  notification: NotificationItem,
) {
  return "View Details";
}

/* ---------------------------------------------
   PAGE
--------------------------------------------- */

export default function SettingsPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [user, setUser] =
    useState<UserData | null>(null);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    profileImage,
    setProfileImage,
  ] = useState<string | null>(
    null,
  );

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    assignmentNotifications,
    setAssignmentNotifications,
  ] = useState(true);

  const [
    dueDateNotifications,
    setDueDateNotifications,
  ] = useState(true);

  const [
    completionNotifications,
    setCompletionNotifications,
  ] = useState(true);

  const [
    feedbackNotifications,
    setFeedbackNotifications,
  ] = useState(true);

  const [
    invitationNotifications,
    setInvitationNotifications,
  ] = useState(true);

  const [savedProfile, setSavedProfile] =
    useState(false);

  const [savedPassword, setSavedPassword] =
    useState(false);

  /* ---------------------------------------------
     NOTIFICATIONS
  --------------------------------------------- */

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationItem[]
  >([]);

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false);

  const [
    notificationError,
    setNotificationError,
  ] = useState("");

  const [
    notificationAction,
    setNotificationAction,
  ] = useState<string | null>(
    null,
  );

  const loadNotifications =
    useCallback(
      async () => {
        try {
          setNotificationLoading(
            true,
          );

          const response =
            await fetch(
              "/api/notifications",
              {
                method: "GET",
                credentials:
                  "include",
                cache: "no-store",
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load notifications.",
            );
          }

          const list =
            Array.isArray(
              data?.notifications,
            )
              ? data.notifications
              : Array.isArray(data)
                ? data
                : [];

          setNotifications(
            list,
          );

          setNotificationError(
            "",
          );
        } catch (error) {
          console.error(
            "LOAD_NOTIFICATIONS_ERROR:",
            error,
          );

          setNotificationError(
            error instanceof Error
              ? error.message
              : "Unable to load notifications.",
          );
        } finally {
          setNotificationLoading(
            false,
          );
        }
      },
      [],
    );

  /* ---------------------------------------------
     LOAD USER + NOTIFICATIONS
  --------------------------------------------- */

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "homesync-user",
        );

      if (storedUser) {
        const parsedUser =
          JSON.parse(
            storedUser,
          );

        const actualUser =
          parsedUser?.user ||
          parsedUser;

        setUser(
          actualUser,
        );

        setName(
          actualUser?.name ||
            "",
        );

        setEmail(
          actualUser?.email ||
            "",
        );

        setProfileImage(
          actualUser?.imageUrl ||
            actualUser?.image ||
            null,
        );
      }
    } catch (error) {
      console.error(
        "LOAD_USER_ERROR:",
        error,
      );
    }

    void loadNotifications();

    const interval =
      window.setInterval(
        () => {
          void loadNotifications();
        },
        15000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [loadNotifications]);

  /* ---------------------------------------------
     NOTIFICATION COUNTS
  --------------------------------------------- */

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (
            notification,
          ) =>
            !notification.isRead,
        ).length,
      [notifications],
    );

  const hasUnreadNotifications =
    notifications.some(
      (
        notification,
      ) =>
        !notification.isRead,
    );

  /* ---------------------------------------------
     MARK ONE AS READ
  --------------------------------------------- */

  const markAsRead = async (
    notificationId: string,
  ) => {
    try {
      setNotificationAction(
        `read-${notificationId}`,
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
            body: JSON.stringify(
              {
                notificationId,
              },
            ),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to mark notification as read.",
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (
              notification,
            ) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification,
          ),
      );
    } catch (error) {
      console.error(
        "MARK_NOTIFICATION_READ_ERROR:",
        error,
      );
    } finally {
      setNotificationAction(
        null,
      );
    }
  };

  /* ---------------------------------------------
     MARK ALL AS READ
  --------------------------------------------- */

  const markAllAsRead =
    async () => {
      try {
        setNotificationAction(
          "mark-all",
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
              body: JSON.stringify(
                {
                  markAllRead: true,
                },
              ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to mark notifications as read.",
          );
        }

        setNotifications(
          (current) =>
            current.map(
              (
                notification,
              ) => ({
                ...notification,
                isRead: true,
              }),
            ),
        );
      } catch (error) {
        console.error(
          "MARK_ALL_READ_ERROR:",
          error,
        );
      } finally {
        setNotificationAction(
          null,
        );
      }
    };

  /* ---------------------------------------------
     DELETE NOTIFICATION
  --------------------------------------------- */

  const deleteNotification =
    async (
      notificationId: string,
    ) => {
      try {
        setNotificationAction(
          `delete-${notificationId}`,
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
              body: JSON.stringify(
                {
                  notificationId,
                },
              ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to delete notification.",
          );
        }

        setNotifications(
          (current) =>
            current.filter(
              (
                notification,
              ) =>
                notification.id !==
                notificationId,
            ),
        );
      } catch (error) {
        console.error(
          "DELETE_NOTIFICATION_ERROR:",
          error,
        );
      } finally {
        setNotificationAction(
          null,
        );
      }
    };

  /* ---------------------------------------------
     VIEW NOTIFICATION DETAILS
  --------------------------------------------- */

  const handleViewDetails = (
    notification: NotificationItem,
  ) => {
    if (
      !notification.isRead
    ) {
      void markAsRead(
        notification.id,
      );
    }

    window.location.href =
      "/dashboard/notifications";
  };

  /* ---------------------------------------------
     PROFILE IMAGE
  --------------------------------------------- */

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = async () => {
      const imageData =
        typeof reader.result ===
        "string"
          ? reader.result
          : null;

      if (!imageData) {
        return;
      }

      // Show image immediately.
      setProfileImage(
        imageData,
      );

      try {
        // Save image in database.
        const response =
          await fetch(
            "/api/auth/profile",
            {
              method: "PATCH",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                imageUrl: imageData,
              }),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          console.error(
            "PROFILE_IMAGE_API_ERROR:",
            data?.message ||
              "Unable to save profile picture.",
          );

          return;
        }

        // Keep localStorage updated too.
        const storedUser =
          localStorage.getItem(
            "homesync-user",
          );

        const existingUser =
          storedUser
            ? JSON.parse(
                storedUser,
              )
            : {};

        const updatedUser = {
          ...existingUser,
          imageUrl: imageData,
          image: imageData,
        };

        localStorage.setItem(
          "homesync-user",
          JSON.stringify(
            updatedUser,
          ),
        );

        setUser(
          updatedUser,
        );
      } catch (error) {
        console.error(
          "SAVE_PROFILE_IMAGE_ERROR:",
          error,
        );
      }
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const handleRemoveProfileImage =
    async () => {
      setProfileImage(
        null,
      );

      try {
        const response =
          await fetch(
            "/api/auth/profile",
            {
              method: "PATCH",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                imageUrl: null,
              }),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          console.error(
            "REMOVE_PROFILE_IMAGE_API_ERROR:",
            data?.message ||
              "Unable to remove profile picture.",
          );

          return;
        }

        const storedUser =
          localStorage.getItem(
            "homesync-user",
          );

        const existingUser =
          storedUser
            ? JSON.parse(
                storedUser,
              )
            : {};

        const updatedUser = {
          ...existingUser,
          imageUrl: null,
          image: null,
        };

        localStorage.setItem(
          "homesync-user",
          JSON.stringify(
            updatedUser,
          ),
        );

        setUser(
          updatedUser,
        );
      } catch (error) {
        console.error(
          "REMOVE_PROFILE_IMAGE_ERROR:",
          error,
        );
      }
    };

  /* ---------------------------------------------
     PROFILE
  --------------------------------------------- */

  const handleProfileSave = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      const storedUser =
        localStorage.getItem(
          "homesync-user",
        );

      const existingUser =
        storedUser
          ? JSON.parse(
              storedUser,
            )
          : {};

      const updatedUser = {
        ...existingUser,
        name,
        email,
        imageUrl: profileImage,
        image: profileImage,
      };

      localStorage.setItem(
        "homesync-user",
        JSON.stringify(
          updatedUser,
        ),
      );

      setUser(
        updatedUser,
      );

      setSavedProfile(
        true,
      );

      setTimeout(() => {
        setSavedProfile(
          false,
        );
      }, 2000);
    } catch (error) {
      console.error(
        "SAVE_PROFILE_ERROR:",
        error,
      );
    }
  };

  /* ---------------------------------------------
     PASSWORD
  --------------------------------------------- */

  const handlePasswordSave = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      newPassword !==
        confirmPassword
    ) {
      return;
    }

    setSavedPassword(
      true,
    );

    setCurrentPassword(
      "",
    );

    setNewPassword(
      "",
    );

    setConfirmPassword(
      "",
    );

    setTimeout(() => {
      setSavedPassword(
        false,
      );
    }, 2000);
  };

  const role =
    user?.role === "OWNER"
      ? "Household Owner"
      : "Household Member";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      <div className="flex min-h-screen">

        {/* =========================================
            DESKTOP SIDEBAR
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
                setMobileOpen(
                  false,
                )
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
                  setMobileOpen(
                    false,
                  )
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
                    setMobileOpen(
                      true,
                    )
                  }
                  className="rounded-xl border border-[#E2E8F0] p-2 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <p className="text-sm font-semibold text-[#172033]">
                    Settings
                  </p>

                  <p className="text-xs text-[#94A3B8]">
                    Manage your account and HomeSync preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                {/* =========================================
                    NOTIFICATION BELL
                ========================================== */}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationOpen(
                        (
                          current,
                        ) =>
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

                  {/* =========================================
                      NOTIFICATION POPUP
                  ========================================== */}

                  {notificationOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() =>
                          setNotificationOpen(
                            false,
                          )
                        }
                      />

                      <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl shadow-slate-900/10">

                        {/* POPUP HEADER */}

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
                                markAllAsRead
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

                        {/* POPUP CONTENT */}

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
                          ) : notificationError ? (
                            <div className="px-5 py-10 text-center">
                              <p className="text-xs font-medium text-red-500">
                                {
                                  notificationError
                                }
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  void loadNotifications()
                                }
                                className="mt-3 text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB]"
                              >
                                Try again
                              </button>
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
                              {notifications
                                .slice(
                                  0,
                                  10,
                                )
                                .map(
                                  (
                                    notification,
                                  ) => {
                                    const Icon =
                                      getNotificationIcon(
                                        notification.type,
                                      );

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

                                          {/* ICON */}

                                          <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                              notification.isRead
                                                ? "bg-[#F8FAFC] text-[#94A3B8]"
                                                : "bg-[#EFF6FF] text-[#3B82F6]"
                                            }`}
                                          >
                                            <Icon
                                              size={
                                                16
                                              }
                                            />
                                          </div>

                                          {/* DETAILS */}

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

                                            <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#94A3B8]">
                                              <Clock3
                                                size={
                                                  11
                                                }
                                              />

                                              {formatDate(
                                                notification.createdAt,
                                              )}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-2">

                                              {/* VIEW DETAILS */}

                                              {(notification.type !==
                                                "GENERAL" ||
                                                notification.title ===
                                                  "Personal Reminder") && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleViewDetails(
                                                      notification,
                                                    );

                                                    setNotificationOpen(
                                                      false,
                                                    );
                                                  }}
                                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                                                >
                                                  {getDetailsLabel(
                                                    notification,
                                                  )}

                                                  <ChevronRight
                                                    size={
                                                      12
                                                    }
                                                  />
                                                </button>
                                              )}

                                              {/* MARK READ */}

                                              {!notification.isRead && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    void markAsRead(
                                                      notification.id,
                                                    )
                                                  }
                                                  disabled={
                                                    actionIsRead ||
                                                    actionIsDelete
                                                  }
                                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6] disabled:opacity-50"
                                                >
                                                  <Check
                                                    size={
                                                      13
                                                    }
                                                  />

                                                  {actionIsRead
                                                    ? "Saving..."
                                                    : "Mark as Read"}
                                                </button>
                                              )}

                                              {/* DELETE */}

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  void deleteNotification(
                                                    notification.id,
                                                  )
                                                }
                                                disabled={
                                                  actionIsDelete
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#FEE2E2] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#EF4444] transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                                              >
                                                <Trash2
                                                  size={
                                                    13
                                                  }
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

                        {/* VIEW ALL */}

                        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                          <Link
                            href="/dashboard/notifications"
                            onClick={() =>
                              setNotificationOpen(
                                false,
                              )
                            }
                            className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#3B82F6] transition hover:text-[#2563EB]"
                          >
                            View all notifications

                            <ChevronRight
                              size={14}
                            />
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* =========================================
                    PROFILE
                ========================================== */}

                <Link
                  href="/dashboard/settings"
                  className="flex h-14 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm font-semibold text-[#172033] transition hover:border-blue-200 hover:bg-[#EFF6FF]"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={
                        user?.name ||
                        "Profile"
                      }
                      className="h-9 w-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-xs font-bold text-[#3B82F6]">
                      {(
                        user?.name ||
                        "U"
                      )
                        .charAt(
                          0,
                        )
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-[#172033]">
                      {user?.name ||
                        "User"}
                    </p>

                    <p className="text-[10px] font-normal text-[#64748B]">
                      {role}
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
            <div className="mx-auto max-w-5xl">

              {/* PAGE HEADER */}

              <div>
                <p className="mb-2 text-sm font-semibold text-[#3B82F6]">
                  Account Preferences
                </p>

                <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#172033] sm:text-4xl">
                  Settings
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                  Update your profile, security preferences,
                  household settings, notifications, and appearance.
                </p>
              </div>

              {/* SETTINGS CONTENT */}

              <div className="mt-8 space-y-6">

                {/* PROFILE */}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] p-6">
                    <SectionHeader
                      icon={User}
                      title="Profile Information"
                      description="Manage the personal information displayed in your HomeSync account."
                    />
                  </div>

                  <form
                    onSubmit={
                      handleProfileSave
                    }
                    className="p-6"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EFF6FF] text-2xl font-bold text-[#3B82F6]">
                        {profileImage ? (
                          <img
                            src={
                              profileImage
                            }
                            alt={
                              name ||
                              "Profile"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (
                            name ||
                            "U"
                          )
                            .charAt(
                              0,
                            )
                            .toUpperCase()
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Profile Picture
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          Your profile picture will be visible to household members.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <label
                            htmlFor="profile-picture"
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#3B82F6] px-3.5 text-xs font-semibold text-white transition hover:bg-[#2563EB]"
                          >
                            <Camera
                              size={
                                15
                              }
                            />

                            {profileImage
                              ? "Change Photo"
                              : "Choose Photo"}
                          </label>

                          <input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={
                              handleProfileImageChange
                            }
                            className="hidden"
                          />

                          {profileImage && (
                            <button
                              type="button"
                              onClick={
                                handleRemoveProfileImage
                              }
                              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#FEE2E2] bg-white px-3.5 text-xs font-semibold text-[#EF4444] transition hover:bg-red-50"
                            >
                              <Trash2
                                size={
                                  14
                                }
                              />

                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="settings-name"
                          className="mb-2 block text-sm font-semibold text-[#172033]"
                        >
                          Full Name
                        </label>

                        <input
                          id="settings-name"
                          type="text"
                          value={name}
                          onChange={(
                            event,
                          ) =>
                            setName(
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="h-12 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="settings-email"
                          className="mb-2 block text-sm font-semibold text-[#172033]"
                        >
                          Email Address
                        </label>

                        <div className="relative">
                          <Mail
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                          />

                          <input
                            id="settings-email"
                            type="email"
                            value={email}
                            onChange={(
                              event,
                            ) =>
                              setEmail(
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Enter your email"
                            autoComplete="email"
                            className="h-12 w-full rounded-xl border border-[#E2E8F0] pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#3B82F6] px-5 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
                      >
                        {savedProfile ? (
                          <>
                            <Check
                              size={
                                17
                              }
                            />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save
                              size={
                                17
                              }
                            />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>

                {/* PASSWORD & SECURITY */}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] p-6">
                    <SectionHeader
                      icon={
                        ShieldCheck
                      }
                      title="Password & Security"
                      description="Keep your HomeSync account secure with a strong password."
                    />
                  </div>

                  <form
                    onSubmit={
                      handlePasswordSave
                    }
                    className="p-6"
                  >
                    <div className="grid gap-5">
                      <div>
                        <label
                          htmlFor="current-password"
                          className="mb-2 block text-sm font-semibold text-[#172033]"
                        >
                          Current Password
                        </label>

                        <div className="relative">
                          <Lock
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                          />

                          <input
                            id="current-password"
                            type="password"
                            value={
                              currentPassword
                            }
                            onChange={(
                              event,
                            ) =>
                              setCurrentPassword(
                                event
                                  .target
                                  .value,
                              )
                            }
                            autoComplete="current-password"
                            className="h-12 w-full rounded-xl border border-[#E2E8F0] pl-10 pr-4 text-sm outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <label
                            htmlFor="new-password"
                            className="mb-2 block text-sm font-semibold text-[#172033]"
                          >
                            New Password
                          </label>

                          <input
                            id="new-password"
                            type="password"
                            value={
                              newPassword
                            }
                            onChange={(
                              event,
                            ) =>
                              setNewPassword(
                                event
                                  .target
                                  .value,
                              )
                            }
                            autoComplete="new-password"
                            className="h-12 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="confirm-password"
                            className="mb-2 block text-sm font-semibold text-[#172033]"
                          >
                            Confirm New Password
                          </label>

                          <input
                            id="confirm-password"
                            type="password"
                            value={
                              confirmPassword
                            }
                            onChange={(
                              event,
                            ) =>
                              setConfirmPassword(
                                event
                                  .target
                                  .value,
                              )
                            }
                            autoComplete="new-password"
                            className="h-12 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm outline-none transition focus:border-[#3B82F6] focus:ring-4 focus:ring-blue-50"
                          />
                        </div>
                      </div>
                    </div>

                    {newPassword &&
                      confirmPassword &&
                      newPassword !==
                        confirmPassword && (
                        <p className="mt-3 text-xs font-medium text-red-500">
                          Passwords do not match.
                        </p>
                      )}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#172033] px-5 text-sm font-semibold text-white transition hover:bg-[#243047]"
                      >
                        {savedPassword ? (
                          <>
                            <Check
                              size={
                                17
                              }
                            />
                            Password Updated
                          </>
                        ) : (
                          <>
                            <Lock
                              size={
                                17
                              }
                            />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>

                {/* HOUSEHOLD */}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] p-6">
                    <SectionHeader
                      icon={Home}
                      title="Household"
                      description="Manage the household associated with your HomeSync account."
                    />
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Current Household
                        </p>

                        <p className="mt-1 text-xs text-[#94A3B8]">
                          Manage your connected household and members.
                        </p>
                      </div>

                      <Link
                        href="/dashboard/members"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#172033] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                      >
                        Manage Household
                      </Link>
                    </div>
                  </div>
                </section>

                {/* NOTIFICATIONS */}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] p-6">
                    <SectionHeader
                      icon={Bell}
                      title="Notifications"
                      description="Choose which HomeSync events should send you notifications."
                    />
                  </div>

                  <div className="divide-y divide-[#E2E8F0]">
                    <div className="flex items-center justify-between gap-5 p-6">
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Task Assignments
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          Notify me when a task is assigned to me.
                        </p>
                      </div>

                      <Toggle
                        enabled={
                          assignmentNotifications
                        }
                        onChange={() =>
                          setAssignmentNotifications(
                            !assignmentNotifications,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-5 p-6">
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Due Date Reminders
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          Remind me when my assigned tasks are due soon.
                        </p>
                      </div>

                      <Toggle
                        enabled={
                          dueDateNotifications
                        }
                        onChange={() =>
                          setDueDateNotifications(
                            !dueDateNotifications,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-5 p-6">
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Task Completion
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          Notify me when household tasks are completed.
                        </p>
                      </div>

                      <Toggle
                        enabled={
                          completionNotifications
                        }
                        onChange={() =>
                          setCompletionNotifications(
                            !completionNotifications,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-5 p-6">
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Feedback Activity
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          Notify me about new household feedback.
                        </p>
                      </div>

                      <Toggle
                        enabled={
                          feedbackNotifications
                        }
                        onChange={() =>
                          setFeedbackNotifications(
                            !feedbackNotifications,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-5 p-6">
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">
                          Household Invitations
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#64748B]">
                          Notify me about household invitations.
                        </p>
                      </div>

                      <Toggle
                        enabled={
                          invitationNotifications
                        }
                        onChange={() =>
                          setInvitationNotifications(
                            !invitationNotifications,
                          )
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* SECURITY INFO */}

                <section className="rounded-2xl border border-blue-100 bg-[#EFF6FF] p-5 sm:p-6">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#3B82F6] shadow-sm">
                      <ShieldCheck
                        size={20}
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#172033]">
                        Your account security matters
                      </h3>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748B]">
                        HomeSync will protect account data with secure authentication,
                        password hashing, household authorization, and protected access
                        to household information.
                      </p>
                    </div>
                  </div>
                </section>
                                {/* LOGOUT */}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] p-6">
                    <SectionHeader
                      icon={Lock}
                      title="Sign Out"
                      description="Sign out of your HomeSync account on this device."
                    />
                  </div>

                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#172033]">
                        Logout from HomeSync
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#64748B]">
                        You can log in again anytime using your account credentials.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch(
                            "/api/auth/logout",
                            {
                              method: "POST",
                              credentials:
                                "include",
                            },
                          );
                        } catch (error) {
                          console.error(
                            "LOGOUT_ERROR:",
                            error,
                          );
                        } finally {
                          localStorage.removeItem(
                            "homesync-user",
                          );

                          window.location.href =
                            "/login";
                        }
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#FEE2E2] bg-white px-4 text-xs font-semibold text-[#EF4444] transition hover:bg-red-50"
                    >
                      <Lock size={15} />
                      Logout
                    </button>
                  </div>
                </section>
              </div>
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
    </main>
  );
}