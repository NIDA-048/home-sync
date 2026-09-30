"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Home,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
  X,
  Trash2,
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: "OWNER" | "MEMBER";
};

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  image?: string;
  profilePicture?: string;
  userId?: string;
};

type HouseholdMemberResponse = {
  id: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string | null;
  };
};

type HouseholdResponse = {
  success: boolean;
  hasHousehold?: boolean;
  message?: string;
  household?: {
    id: string;
    name: string;
    invitationCode: string;
    myRole: "OWNER" | "MEMBER";
    members: HouseholdMemberResponse[];
    createdAt: string;
    updatedAt: string;
  } | null;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedTaskId?: string | null;
};

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
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
    href: "/dashboard/member",
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
        <Home size={21} strokeWidth={2.2} />
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
            item.href === "/dashboard/member";

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() =>
                setMobileOpen?.(false)
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

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
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
    </div>
  );
}

/* ---------------------------------------------
   MEMBER AVATAR
--------------------------------------------- */

function MemberAvatar({
  member,
}: {
  member: Member;
}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] text-base font-bold text-[#3B82F6]">
      {member.image ? (
        <img
          src={member.image}
          alt={member.name}
          className="h-full w-full object-cover"
        />
      ) : (
        member.name
          .charAt(0)
          .toUpperCase()
      )}
    </div>
  );
}

/* ---------------------------------------------
   SUMMARY CARD
--------------------------------------------- */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748B]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#172033]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-[#94A3B8]">
        {subtitle}
      </p>
    </div>
  );
}

/* ---------------------------------------------
   INVITATION CODE MODAL
--------------------------------------------- */

function InvitationModal({
  onClose,
  invitationCode,
}: {
  onClose: () => void;
  invitationCode: string;
}) {
  const [copied, setCopied] =
    useState(false);

  const copyCode = async () => {
    if (!invitationCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        invitationCode,
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E2E8F0] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#3B82F6]">
              Household Invitation
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#172033]">
              Invite a Member
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Share this invitation code with the person you want
              to add to your household.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] p-2 text-[#64748B] transition hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-3 text-sm font-bold text-[#172033]">
            Household Invitation Code
          </p>

          <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF] p-5">
            <div className="flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-5">
              <p className="select-all text-2xl font-bold tracking-[0.18em] text-[#172033] sm:text-3xl">
                {invitationCode || "Loading..."}
              </p>
            </div>

            <button
              type="button"
              onClick={copyCode}
              disabled={!invitationCode}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={17} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={17} />
                  Copy Invitation Code
                </>
              )}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-xs leading-5 text-[#64748B]">
              Send this code to your household member. They can use
              it from the Join Household option to become a member.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#E2E8F0] bg-[#F8FAFC] p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#172033] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253149]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   ADD MEMBER MODAL
--------------------------------------------- */

function AddMemberModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const handleAdd = () => {
    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim();

    if (!cleanName || !cleanEmail) {
      return;
    }

    window.alert(
      "Please share the household invitation code with this member so they can join the household.",
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#3B82F6]">
              Household
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#172033]">
              Add Member
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Enter the member&apos;s name and email address to add
              them to your household.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] p-2 text-[#64748B] transition hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label
              htmlFor="member-name"
              className="mb-2 block text-sm font-bold text-[#172033]"
            >
              Member Name
            </label>

            <input
              id="member-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter member name"
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-[#CBD5E1] px-4 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10"
            />
          </div>

          <div>
            <label
              htmlFor="member-email"
              className="mb-2 block text-sm font-bold text-[#172033]"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="member@example.com"
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full rounded-xl border border-[#CBD5E1] pl-11 pr-4 text-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-[#EFF6FF] p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#3B82F6]">
                <UserPlus size={18} />
              </div>

              <p className="text-xs leading-5 text-[#64748B]">
                The member should join using your household invitation
                code. This keeps household membership connected to the
                real database.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-semibold text-[#172033] transition hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim() || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   NOTIFICATION HELPERS
--------------------------------------------- */

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

/* ---------------------------------------------
   MAIN PAGE
--------------------------------------------- */

export default function MembersPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [members, setMembers] =
    useState<Member[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showInvitation, setShowInvitation] =
    useState(false);

  const [showAddMember, setShowAddMember] =
    useState(false);

  const [invitationCode, setInvitationCode] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState<ProfileUser | null>(null);

  const [householdRole, setHouseholdRole] =
    useState<"OWNER" | "MEMBER" | null>(
      null,
    );

  const [householdLoading, setHouseholdLoading] =
    useState(true);

  const [householdError, setHouseholdError] =
    useState("");

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

  /* ---------------------------------------------
     LOAD CURRENT USER
  --------------------------------------------- */

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "homesync-user",
        );

      if (!storedUser) {
        return;
      }

      const parsedUser: StoredUser =
        JSON.parse(storedUser);

      const userData =
        (parsedUser as any)?.user ||
        parsedUser;

      setCurrentUser({
        id:
          userData?.id ||
          parsedUser?.userId ||
          "",
        name:
          userData?.name ||
          "HomeSync User",
        email:
          userData?.email ||
          "",
        imageUrl:
          userData?.imageUrl ||
          userData?.image ||
          userData?.profilePicture ||
          null,
      });
    } catch (error) {
      console.error(
        "Unable to load stored user:",
        error,
      );
    }
  }, []);

  /* ---------------------------------------------
     LOAD HOUSEHOLD
  --------------------------------------------- */

  const loadHousehold = async () => {
    try {
      setHouseholdLoading(true);
      setHouseholdError("");

      const response = await fetch(
        "/api/auth/household/current",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const responseText =
        await response.text();

      let data: HouseholdResponse;

      try {
        data =
          JSON.parse(
            responseText,
          );
      } catch {
        console.error(
          "HOUSEHOLD_INVALID_JSON:",
          response.status,
          responseText,
        );

        setHouseholdError(
          "Unable to load household information.",
        );

        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(
            "homesync-household",
          );

          window.location.href =
            "/login";

          return;
        }

        setHouseholdError(
          data.message ||
            "Unable to load household information.",
        );

        return;
      }

      if (
        !data.success ||
        !data.household
      ) {
        localStorage.removeItem(
          "homesync-household",
        );

        window.location.href =
          "/household";

        return;
      }

      const household =
        data.household;

      setInvitationCode(
        household.invitationCode ||
          "",
      );

      setHouseholdRole(
        household.myRole,
      );

      try {
        localStorage.setItem(
          "homesync-household",
          JSON.stringify(
            household,
          ),
        );
      } catch {
        // Ignore localStorage errors.
      }

      const formattedMembers: Member[] =
        Array.isArray(
          household.members,
        )
          ? household.members.map(
              (member) => ({
                id:
                  member.user.id ||
                  member.id,
                name:
                  member.user.name ||
                  "Unknown Member",
                email:
                  member.user.email ||
                  "",
                image:
                  member.user.imageUrl ||
                  "",
                role:
                  member.role,
              }),
            )
          : [];

      setMembers(
        formattedMembers,
      );

      const ownerOrCurrentMember =
        household.members.find(
          (member) =>
            member.user.id ===
            currentUser?.id,
        );

      if (
        ownerOrCurrentMember
      ) {
        setCurrentUser(
          (previous) => ({
            id:
              ownerOrCurrentMember
                .user.id,
            name:
              ownerOrCurrentMember
                .user.name ||
              previous?.name ||
              "HomeSync User",
            email:
              ownerOrCurrentMember
                .user.email ||
              previous?.email ||
              "",
            imageUrl:
              ownerOrCurrentMember
                .user.imageUrl ||
              previous?.imageUrl ||
              null,
          }),
        );
      }
    } catch (error) {
      console.error(
        "HOUSEHOLD_LOAD_ERROR:",
        error,
      );

      setHouseholdError(
        error instanceof Error
          ? error.message
          : "Unable to load household information.",
      );
    } finally {
      setHouseholdLoading(
        false,
      );
    }
  };

  /* ---------------------------------------------
     LOAD NOTIFICATIONS
  --------------------------------------------- */

  const loadNotifications =
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
              credentials: "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const responseText =
          await response.text();

        let data: unknown;

        try {
          data =
            JSON.parse(
              responseText,
            );
        } catch {
          console.error(
            "NOTIFICATIONS_INVALID_JSON:",
            response.status,
            responseText,
          );

          return;
        }

        if (!response.ok) {
          console.error(
            "NOTIFICATIONS_LOAD_ERROR:",
            data,
          );

          return;
        }

        const rawNotifications =
          Array.isArray(data)
            ? data
            : Array.isArray(
                  (
                    data as {
                      notifications?: unknown[];
                    }
                  )?.notifications,
                )
              ? (
                  data as {
                    notifications: unknown[];
                  }
                ).notifications
              : Array.isArray(
                    (
                      data as {
                        items?: unknown[];
                      }
                    )?.items,
                  )
                ? (
                    data as {
                      items: unknown[];
                    }
                  ).items
                : [];

        const formattedNotifications: Notification[] =
          rawNotifications
            .map((item) => {
              const notification =
                item as Record<
                  string,
                  unknown
                >;

              return {
                id: String(
                  notification.id ??
                    "",
                ),
                type: String(
                  notification.type ??
                    "GENERAL",
                ),
                title: String(
                  notification.title ??
                    "",
                ),
                message: String(
                  notification.message ??
                    "You have a new notification.",
                ),
                isRead: Boolean(
                  notification.isRead,
                ),
                createdAt: String(
                  notification.createdAt ??
                    new Date().toISOString(),
                ),
                relatedTaskId:
                  notification.relatedTaskId !=
                  null
                    ? String(
                        notification.relatedTaskId,
                      )
                    : null,
              };
            })
            .filter(
              (notification) =>
                notification.id,
            );

        setNotifications(
          formattedNotifications,
        );
      } catch (error) {
        console.error(
          "NOTIFICATIONS_LOAD_ERROR:",
          error,
        );
      } finally {
        setNotificationLoading(
          false,
        );
      }
    };

  /* ---------------------------------------------
     INITIAL LOAD + REFRESH
  --------------------------------------------- */

  useEffect(() => {
    loadHousehold();
    loadNotifications();

    const interval =
      window.setInterval(() => {
        loadHousehold();
        loadNotifications();
      }, 15000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  /* ---------------------------------------------
     CLOSE NOTIFICATION PANEL
  --------------------------------------------- */

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
        setNotificationsOpen(
          false,
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /* ---------------------------------------------
     MARK ONE NOTIFICATION READ
  --------------------------------------------- */

  const markNotificationRead =
    async (
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
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                notificationId,
                isRead: true,
              }),
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        if (!response.ok) {
          console.error(
            "MARK_NOTIFICATION_READ_ERROR:",
            data,
          );

          return;
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
     MARK ALL READ
  --------------------------------------------- */

  const markAllNotificationsRead =
    async () => {
      if (
        notifications.some(
          (notification) =>
            !notification.isRead,
        ) === false
      ) {
        return;
      }

      try {
        setNotificationAction(
          "mark-all",
        );

        const response =
          await fetch(
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

        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        if (!response.ok) {
          console.error(
            "MARK_ALL_NOTIFICATIONS_ERROR:",
            data,
          );

          return;
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
          "MARK_ALL_NOTIFICATIONS_ERROR:",
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
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this notification?",
        );

      if (!confirmed) {
        return;
      }

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
              credentials:
                "include",
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => null,
            );

        if (!response.ok) {
          console.error(
            "DELETE_NOTIFICATION_ERROR:",
            data,
          );

          window.alert(
            data?.message ||
              "Unable to delete this notification.",
          );

          return;
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

        window.alert(
          "Something went wrong while deleting the notification.",
        );
      } finally {
        setNotificationAction(
          null,
        );
      }
    };

  /* ---------------------------------------------
     VIEW NOTIFICATION
  --------------------------------------------- */

  const handleViewNotification =
    (
      notification: Notification,
    ) => {
      if (!notification.isRead) {
        markNotificationRead(
          notification.id,
        );
      }

      setNotificationsOpen(false);

      window.location.href =
        `/dashboard/notifications?notification=${encodeURIComponent(
          notification.id,
        )}`;
    };

  /* ---------------------------------------------
     FILTER MEMBERS
  --------------------------------------------- */

  const filteredMembers =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return members;
      }

      return members.filter(
        (member) =>
          member.name
            .toLowerCase()
            .includes(query) ||
          member.email
            .toLowerCase()
            .includes(query),
      );
    }, [
      members,
      searchQuery,
    ]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead,
    ).length;

  const hasUnreadNotifications =
    unreadCount > 0;

  const connectedCount =
    members.length;

  const invitationCount = 0;

  const householdCount =
    members.length;

  const profileInitial =
    currentUser?.name
      ?.charAt(0)
      .toUpperCase() ||
    "N";

  const profileRole =
    householdRole === "OWNER"
      ? "Household Owner"
      : "Household Member";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#172033]">
      <div className="flex min-h-screen">
        {/* =========================================
            DESKTOP SIDEBAR
        ========================================== */}

        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#172033] lg:flex">
          <SidebarContent />
        </aside>

        {/* =========================================
            MOBILE SIDEBAR
        ========================================== */}

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
                    setMobileOpen(
                      false,
                    )
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
            </aside>
          </>
        )}

        {/* =========================================
            MAIN AREA
        ========================================== */}

        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          {/* =========================================
              NAVBAR
          ========================================== */}

          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
            <div className="flex h-20 items-center justify-between px-5 sm:px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(
                      true,
                    )
                  }
                  className="rounded-xl border border-[#E2E8F0] p-2.5 text-[#172033] transition hover:bg-[#F8FAFC] lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={21} />
                </button>

                <div>
                  <p className="text-sm font-semibold text-[#172033]">
                    Members
                  </p>

                  <p className="hidden text-xs text-[#94A3B8] sm:block">
                    Manage household members and shared responsibilities
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* NOTIFICATIONS */}

                <div
                  ref={
                    notificationRef
                  }
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
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
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

                    {/* Dynamic blue unread dot */}
                    {hasUnreadNotifications && (
                      <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3B82F6] opacity-50" />

                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-[#3B82F6]" />
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl shadow-slate-900/10">
                      {/* NOTIFICATION HEADER */}

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
                            Household
                            activity
                            and
                            reminders
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

                      {/* NOTIFICATION LIST */}

                      <div className="max-h-[430px] overflow-y-auto">
                        {notificationLoading &&
                        notifications.length ===
                          0 ? (
                          <div className="flex flex-col items-center justify-center px-6 py-12">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                            <p className="mt-3 text-xs font-medium text-[#64748B]">
                              Loading
                              notifications...
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
                              No
                              notifications
                            </h4>

                            <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#94A3B8]">
                              You&apos;re
                              all
                              caught
                              up.
                              New
                              task
                              assignments
                              and
                              reminders
                              will
                              appear
                              here.
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
                                        <Bell
                                          size={
                                            16
                                          }
                                        />
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
                                              notification.title,
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
                                              size={
                                                13
                                              }
                                            />
                                            View
                                            Details
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
                                                size={
                                                  13
                                                }
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

                      {/* VIEW ALL NOTIFICATIONS */}

                      {notifications.length > 0 && (
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

                {/* PROFILE */}

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-2.5 py-2 transition hover:bg-[#F8FAFC]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] text-sm font-bold text-[#3B82F6]">
                    {currentUser?.imageUrl ? (
                      <img
                        src={
                          currentUser.imageUrl
                        }
                        alt={
                          currentUser.name ||
                          "User"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profileInitial
                    )}
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <p className="max-w-[120px] truncate text-sm font-semibold text-[#172033]">
                      {currentUser?.name ||
                        "Nida"}
                    </p>

                    <p className="text-[10px] font-semibold text-[#64748B]">
                      {profileRole}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          {/* =========================================
              PAGE CONTENT
          ========================================== */}

          <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:px-10">
            {/* PAGE HEADER */}

            <section className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#3B82F6]">
                  Household Management
                </p>

                <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172033] sm:text-4xl">
                  Household Members
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                  Manage the people in your household and keep
                  everyone connected in one place.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* INVITE */}

                <button
                  type="button"
                  onClick={() =>
                    setShowInvitation(
                      true,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#172033] shadow-sm transition hover:border-[#3B82F6] hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                >
                  <Mail size={18} />
                  Invite Member
                </button>

                {/* ADD MEMBER */}

                <button
                  type="button"
                  onClick={() =>
                    setShowAddMember(
                      true,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2563EB] hover:shadow-md"
                >
                  <Plus size={18} />
                  Add Member
                </button>
              </div>
            </section>

            {/* API ERROR */}

            {householdError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {householdError}
              </div>
            )}

            {/* =========================================
                SUMMARY
            ========================================== */}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total Members"
                value={
                  householdLoading
                    ? 0
                    : members.length
                }
                subtitle="People in your household"
                icon={
                  <Users
                    size={21}
                    className="text-[#3B82F6]"
                  />
                }
                iconBg="bg-[#EFF6FF]"
              />

              <SummaryCard
                title="Connected"
                value={
                  householdLoading
                    ? 0
                    : connectedCount
                }
                subtitle="Currently listed members"
                icon={
                  <CheckCircle2
                    size={21}
                    className="text-emerald-600"
                  />
                }
                iconBg="bg-emerald-50"
              />

              <SummaryCard
                title="Invitations"
                value={
                  invitationCount
                }
                subtitle="Pending invitations"
                icon={
                  <Mail
                    size={21}
                    className="text-[#3B82F6]"
                  />
                }
                iconBg="bg-[#EFF6FF]"
              />

              <SummaryCard
                title="Household"
                value={
                  householdLoading
                    ? 0
                    : householdCount
                }
                subtitle="Members connected"
                icon={
                  <Home
                    size={21}
                    className="text-[#3B82F6]"
                  />
                }
                iconBg="bg-[#EFF6FF]"
              />
            </section>

            {/* =========================================
                SEARCH
            ========================================== */}

            <section className="mt-9 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />

                <input
                  type="text"
                  value={
                    searchQuery
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchQuery(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search members by name or email..."
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/10"
                />
              </div>
            </section>

            {/* =========================================
                MEMBERS LIST
            ========================================== */}

            <section className="mt-9">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#172033]">
                    Members
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    Your household members are shown below.
                  </p>
                </div>

                <p className="text-xs font-semibold text-[#94A3B8]">
                  {filteredMembers.length}{" "}
                  {filteredMembers.length ===
                  1
                    ? "member"
                    : "members"}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                {/* TABLE HEADER */}

                <div className="hidden border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3 md:grid md:grid-cols-[minmax(280px,1.3fr)_minmax(260px,1fr)] md:items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Member
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                    Email Address
                  </span>
                </div>

                {filteredMembers.length >
                0 ? (
                  filteredMembers.map(
                    (member) => (
                      <div
                        key={
                          member.id
                        }
                        className="grid gap-4 border-b border-[#E2E8F0] px-5 py-5 last:border-b-0 md:grid-cols-[minmax(280px,1.3fr)_minmax(260px,1fr)] md:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <MemberAvatar
                            member={
                              member
                            }
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-[#172033]">
                                {
                                  member.name
                                }
                              </p>

                              {member.role ===
                                "OWNER" && (
                                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#3B82F6]">
                                  Owner
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-[#94A3B8] md:hidden">
                              {
                                member.email
                              }
                            </p>
                          </div>
                        </div>

                        <div className="hidden min-w-0 md:block">
                          <div className="flex items-center gap-2">
                            <Mail
                              size={16}
                              className="shrink-0 text-[#94A3B8]"
                            />

                            <p className="truncate text-sm text-[#475569]">
                              {
                                member.email
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="p-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#94A3B8]">
                      <Users
                        size={25}
                      />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-[#172033]">
                      {householdLoading
                        ? "Loading members..."
                        : "No members yet"}
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
                      Add a member manually or share your household
                      invitation code to connect someone to your home.
                    </p>

                    {!householdLoading && (
                      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            setShowInvitation(
                              true,
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#172033] transition hover:border-[#3B82F6] hover:text-[#3B82F6]"
                        >
                          <Mail
                            size={16}
                          />
                          Invite with Code
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShowAddMember(
                              true,
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2563EB]"
                        >
                          <Plus
                            size={16}
                          />
                          Add Member
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* =========================================
                INFO CARD
            ========================================== */}

            <section className="mt-6 rounded-2xl border border-blue-100 bg-[#EFF6FF] p-5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#3B82F6] shadow-sm">
                  <UserPlus size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    Add people to your household
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-[#64748B]">
                    You can add a member directly with their name and
                    email, or share your household invitation code so
                    they can join themselves.
                  </p>
                </div>
              </div>
            </section>
          </main>

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

        {/* =========================================
            INVITATION MODAL
        ========================================== */}

        {showInvitation && (
          <InvitationModal
            onClose={() =>
              setShowInvitation(
                false,
              )
            }
            invitationCode={
              invitationCode
            }
          />
        )}

        {/* =========================================
            ADD MEMBER MODAL
        ========================================== */}

        {showAddMember && (
          <AddMemberModal
            onClose={() =>
              setShowAddMember(
                false,
              )
            }
          />
        )}
      </div>
    </main>
  );
}