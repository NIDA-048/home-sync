"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquare,
  Plus,
  Users,
  Settings,
  UserPlus,
  X,
  Eye,
  Check,
  Trash2,
} from "lucide-react";

type TaskStatus = "TO_DO" | "PENDING" | "IN_PROGRESS" | "DONE";

type Task = {
  id: string;
  title: string;
  type: "Daily" | "Temporary" | "Permanent";
  status: TaskStatus;
  due: string;
  minutes: number;
  assignedUserIds: string[];
  scheduledDateKey: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
  image: string;
  totalTasks: number;
  pending: number;
  role?: "OWNER" | "MEMBER";
};

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  image?: string;
  profilePicture?: string;
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
    image?: string | null;
    profilePicture?: string | null;
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
  relatedFeedbackId?: string | null;
};

const statusColumns: {
  key: TaskStatus;
  title: string;
  color: string;
  dot: string;
}[] = [
  {
    key: "TO_DO",
    title: "To Do",
    color: "text-[#64748B]",
    dot: "bg-[#94A3B8]",
  },
  {
    key: "PENDING",
    title: "Pending",
    color: "text-[#D97706]",
    dot: "bg-[#F59E0B]",
  },
  {
    key: "IN_PROGRESS",
    title: "In Progress",
    color: "text-[#3B82F6]",
    dot: "bg-[#3B82F6]",
  },
  {
    key: "DONE",
    title: "Done",
    color: "text-[#16A34A]",
    dot: "bg-[#22C55E]",
  },
];

const quickActions = [
  {
    title: "Add Task",
    description: "Create and assign a new household task.",
    href: "/dashboard/tasks",
    icon: Plus,
  },
  {
    title: "Invite Member",
    description: "Invite someone to join your household.",
    href: "/dashboard/members",
    icon: UserPlus,
  },
  {
    title: "Calendar",
    description: "View upcoming and scheduled household tasks.",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Feedback",
    description: "Share anonymous feedback with your household.",
    href: "/dashboard/feedback",
    icon: MessageSquare,
  },
];

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getNotificationIcon(type: string) {
  const normalizedType = type.toUpperCase();

  if (
    normalizedType.includes("TASK") ||
    normalizedType.includes("ASSIGNED")
  ) {
    return <ListChecks size={17} />;
  }

  if (normalizedType.includes("FEEDBACK")) {
    return <MessageSquare size={17} />;
  }

  if (normalizedType.includes("INVIT")) {
    return <UserPlus size={17} />;
  }

  if (normalizedType.includes("REMINDER")) {
    return <Clock3 size={17} />;
  }

  return <Bell size={17} />;
}

function getNotificationTitle(
  type: string,
  notificationTitle?: string,
) {
  if (notificationTitle?.trim()) {
    return notificationTitle;
  }

  const normalizedType = type.toUpperCase();

  if (normalizedType === "TASK_ASSIGNED") {
    return "New Task Assigned";
  }

  if (normalizedType === "TASK_COMPLETED") {
    return "Task Completed";
  }

  if (
    normalizedType === "TASK_DUE_SOON" ||
    normalizedType === "TASK_REMINDER"
  ) {
    return "Task Reminder";
  }

  if (normalizedType === "TASK_REASSIGNED") {
    return "Task Reassigned";
  }

  if (normalizedType.includes("INVIT")) {
    return "Household Invitation";
  }

  if (normalizedType.includes("FEEDBACK")) {
    return "Feedback";
  }

  return "Notification";
}

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * Converts a task date into YYYY-MM-DD.
 *
 * The API stores scheduledDate at UTC midnight,
 * so UTC values are used here to avoid accidentally
 * moving the task to the previous/next day.
 */
function getDateKey(value: unknown): string {
  if (!value) {
    return "";
  }

  const raw = String(value).trim();

  const directMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTaskType(rule: unknown): Task["type"] {
  const normalizedRule = String(rule ?? "").toUpperCase();

  if (normalizedRule === "RECURRING") {
    return "Daily";
  }

  if (normalizedRule === "PERMANENT") {
    return "Permanent";
  }

  return "Temporary";
}

function getTaskStatus(status: unknown): TaskStatus {
  const normalizedStatus = String(status ?? "")
    .toUpperCase()
    .trim();

  if (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "IN_PROGRESS" ||
    normalizedStatus === "DONE"
  ) {
    return normalizedStatus;
  }

  return "TO_DO";
}

function getTaskAssignedUserIds(
  task: Record<string, unknown>,
): string[] {
  if (!Array.isArray(task.assignments)) {
    return [];
  }

  const ids = task.assignments
    .map((assignment) => {
      if (
        !assignment ||
        typeof assignment !== "object"
      ) {
        return "";
      }

      const assignmentRecord =
        assignment as Record<string, unknown>;

      if (assignmentRecord.userId) {
        return String(
          assignmentRecord.userId,
        );
      }

      if (
        assignmentRecord.user &&
        typeof assignmentRecord.user === "object"
      ) {
        const user =
          assignmentRecord.user as Record<
            string,
            unknown
          >;

        if (user.id) {
          return String(user.id);
        }
      }

      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(ids));
}

function formatTaskDueDate(
  scheduledDate: unknown,
) {
  if (!scheduledDate) {
    return "Today";
  }

  const date = new Date(
    String(scheduledDate),
  );

  if (Number.isNaN(date.getTime())) {
    return "Today";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTaskMinutes(
  estimatedMinutes: unknown,
) {
  const minutes = Number(
    estimatedMinutes ?? 0,
  );

  return Number.isFinite(minutes)
    ? minutes
    : 0;
}

export default function DashboardPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  const [householdName, setHouseholdName] =
    useState("");

  const [invitationCode, setInvitationCode] =
    useState("");

  const [householdRole, setHouseholdRole] =
    useState<"OWNER" | "MEMBER" | "">("");

  const [members, setMembers] =
    useState<Member[]>([]);

  const [householdLoading, setHouseholdLoading] =
    useState(true);

  const [householdError, setHouseholdError] =
    useState("");

  /* ==================== TASKS ==================== */

  const [dashboardTasks, setDashboardTasks] =
    useState<Task[]>([]);

  const [tasksLoading, setTasksLoading] =
    useState(true);

  const [tasksError, setTasksError] =
    useState("");

  /* ==================== NOTIFICATIONS ==================== */

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

  /*
   * This is calculated from the real notification
   * data returned by /api/notifications.
   *
   * The blue dot is therefore NOT hard-coded.
   */
  const unreadCount = notifications.filter(
    (notification) =>
      !notification.isRead,
  ).length;

  const hasUnreadNotifications =
    unreadCount > 0;

  /* ==================== DERIVED TASK DATA ==================== */

  const totalTasks =
    dashboardTasks.length;

  const myTasks = currentUser?.id
    ? dashboardTasks.filter((task) =>
        task.assignedUserIds.includes(
          String(currentUser.id),
        ),
      )
    : [];

  const completedTasks =
    dashboardTasks.filter(
      (task) => task.status === "DONE",
    ).length;

  const pendingTasks =
    dashboardTasks.filter(
      (task) =>
        task.status === "TO_DO" ||
        task.status === "PENDING" ||
        task.status === "IN_PROGRESS",
    ).length;

  const progressPercentage =
    totalTasks > 0
      ? Math.round(
          (completedTasks /
            totalTasks) *
            100,
        )
      : 0;

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
        },
      ),
    );

    try {
      const storedUser =
        localStorage.getItem(
          "homesync-user",
        );

      if (storedUser) {
        const user: StoredUser =
          JSON.parse(storedUser);

        if (
          user &&
          (user.id ||
            user.email ||
            user.name)
        ) {
          setCurrentUser(user);
        }
      }
    } catch {
      setCurrentUser(null);
    }

    loadHousehold();
    loadNotifications();

    const notificationInterval =
      window.setInterval(() => {
        loadNotifications();
      }, 15000);

    return () => {
      window.clearInterval(
        notificationInterval,
      );
    };
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadTasks();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const taskInterval =
      window.setInterval(() => {
        loadTasks();
      }, 30000);

    return () => {
      window.clearInterval(
        taskInterval,
      );
    };
  }, [currentUser?.id]);

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

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /* ==================== LOAD TASKS ==================== */

  async function loadTasks() {
    try {
      setTasksLoading(true);
      setTasksError("");

      const today =
        getTodayString();

      const response = await fetch(
        `/api/tasks?date=${encodeURIComponent(
          today,
        )}`,
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
        data = JSON.parse(
          responseText,
        );
      } catch {
        console.error(
          "DASHBOARD_TASKS_INVALID_JSON:",
          response.status,
          responseText,
        );

        setTasksError(
          "Unable to read task data from the server.",
        );

        return;
      }

      if (!response.ok) {
        console.error(
          "DASHBOARD_TASKS_LOAD_ERROR:",
          data,
        );

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "homesync-user",
          );

          window.location.href =
            "/login";

          return;
        }

        setTasksError(
          "Unable to load today's tasks.",
        );

        return;
      }

      const rawTasks =
        Array.isArray(data)
          ? data
          : Array.isArray(
                (
                  data as {
                    tasks?: unknown[];
                  }
                )?.tasks,
              )
            ? (
                data as {
                  tasks: unknown[];
                }
              ).tasks
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

      const todayTasks =
        rawTasks
          .map((item) => {
            if (
              !item ||
              typeof item !==
                "object"
            ) {
              return null;
            }

            const task =
              item as Record<
                string,
                unknown
              >;

            const taskId = String(
              task.id ?? "",
            );

            if (!taskId) {
              return null;
            }

            const scheduledDateKey =
              getDateKey(
                task.scheduledDate,
              );

            if (
              scheduledDateKey !==
              today
            ) {
              return null;
            }

            if (
              task.isActive === false
            ) {
              return null;
            }

            return {
              id: taskId,
              title: String(
                task.title ??
                  "Untitled Task",
              ),
              type: getTaskType(
                task.rule,
              ),
              status: getTaskStatus(
                task.status,
              ),
              due:
                formatTaskDueDate(
                  task.scheduledDate,
                ),
              minutes:
                getTaskMinutes(
                  task.estimatedMinutes,
                ),
              assignedUserIds:
                getTaskAssignedUserIds(
                  task,
                ),
              scheduledDateKey,
            };
          })
          .filter(
            (
              task,
            ): task is Task =>
              task !== null,
          );

      const uniqueTodayTasks =
        Array.from(
          new Map(
            todayTasks.map(
              (task) => [
                task.id,
                task,
              ],
            ),
          ).values(),
        );

      console.log(
        "DASHBOARD_TODAY_TASKS:",
        {
          today,
          householdTaskCount:
            uniqueTodayTasks.length,
          tasks:
            uniqueTodayTasks.map(
              (task) => ({
                id: task.id,
                title: task.title,
                status:
                  task.status,
                assignedUserIds:
                  task.assignedUserIds,
              }),
            ),
        },
      );

      setDashboardTasks(
        uniqueTodayTasks,
      );
    } catch (error) {
      console.error(
        "DASHBOARD_TASKS_LOAD_ERROR:",
        error,
      );

      setTasksError(
        "Unable to connect to the task API.",
      );
    } finally {
      setTasksLoading(false);
    }
  }

  /* ==================== NOTIFICATIONS ==================== */

  async function loadNotifications() {
    try {
      setNotificationLoading(true);

      const response = await fetch(
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
        data = JSON.parse(
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

      const notificationList =
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
        notificationList
          .map((item) => {
            const notification =
              item as Record<
                string,
                unknown
              >;

            return {
              id: String(
                notification.id ?? "",
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
              relatedFeedbackId:
                notification.relatedFeedbackId !=
                null
                  ? String(
                      notification.relatedFeedbackId,
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
            isRead: true,
          }),
        },
      );

      const data =
        await response
          .json()
          .catch(() => null);

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
            (notification) =>
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
  }

  async function markAllNotificationsRead() {
    if (unreadCount === 0) {
      return;
    }

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

      const data =
        await response
          .json()
          .catch(() => null);

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
            (notification) => ({
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
  }

  async function deleteNotification(
    notificationId: string,
  ) {
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

      const response = await fetch(
        `/api/notifications/${encodeURIComponent(
          notificationId,
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data =
        await response
          .json()
          .catch(() => null);

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
            (notification) =>
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
  }

  /*
   * Notification details are connected to their
   * correct destination:
   *
   * Task notification -> task details
   * Feedback notification -> feedback details
   * Other notification -> notifications page
   */
  function handleViewNotification(
    notification: Notification,
  ) {
    if (!notification.isRead) {
      markNotificationRead(
        notification.id,
      );
    }

    if (notification.relatedTaskId) {
      window.location.href =
        `/dashboard/tasks?task=${encodeURIComponent(
          notification.relatedTaskId,
        )}`;

      return;
    }

    if (
      notification.relatedFeedbackId
    ) {
      window.location.href =
        `/dashboard/feedback?feedbackId=${encodeURIComponent(
          notification.relatedFeedbackId,
        )}`;

      return;
    }

    window.location.href =
      "/dashboard/notifications";
  }

  /* ==================== HOUSEHOLD ==================== */

  const loadHousehold =
    async () => {
      setHouseholdLoading(true);
      setHouseholdError("");

      try {
        const response =
          await fetch(
            "/api/auth/household/current",
            {
              method: "GET",
              credentials:
                "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
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
        } catch (jsonError) {
          console.error(
            "DASHBOARD_INVALID_JSON:",
            jsonError,
            responseText,
          );

          setHouseholdError(
            `Household API returned an invalid response (${response.status}). Please check the terminal for the exact error.`,
          );

          return;
        }

        if (!response.ok) {
          if (
            response.status ===
            401
          ) {
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

        if (!data.success) {
          setHouseholdError(
            data.message ||
              "Unable to load household information.",
          );

          return;
        }

        if (
          !data.hasHousehold ||
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

        setHouseholdName(
          household.name,
        );

        setInvitationCode(
          household.invitationCode,
        );

        setHouseholdRole(
          household.myRole,
        );

        const formattedMembers: Member[] =
          household.members.map(
            (member) => {
              const memberImage =
                member.user.imageUrl ||
                member.user.image ||
                member.user.profilePicture ||
                (currentUser?.id &&
                String(currentUser.id) ===
                  String(member.user.id)
                  ? currentUser.imageUrl ||
                    currentUser.image ||
                    currentUser.profilePicture ||
                    ""
                  : "");

              return {
                id: member.user.id,
                name: member.user.name,
                email:
                  member.user.email,
                image: memberImage,
                totalTasks: 0,
                pending: 0,
                role: member.role,
              };
            },
          );

        setMembers(
          formattedMembers,
        );

        localStorage.setItem(
          "homesync-household",
          JSON.stringify({
            id: household.id,
            name: household.name,
            invitationCode:
              household.invitationCode,
            myRole:
              household.myRole,
          }),
        );
      } catch (error) {
        console.error(
          "DASHBOARD_HOUSEHOLD_ERROR:",
          error,
        );

        setHouseholdError(
          "Unable to connect to the household API. Please check that your Next.js server is running and look at the terminal for the exact error.",
        );
      } finally {
        setHouseholdLoading(
          false,
        );
      }
    };

  useEffect(() => {
    if (!members.length) {
      return;
    }

    refreshMemberTaskCounts();
  }, [dashboardTasks]);

  function refreshMemberTaskCounts() {
    setMembers(
      (currentMembers) =>
        currentMembers.map(
          (member) => {
            const memberTasks =
              dashboardTasks.filter(
                (task) =>
                  task.assignedUserIds.includes(
                    String(member.id),
                  ),
              );

            const memberPending =
              memberTasks.filter(
                (task) =>
                  task.status ===
                    "TO_DO" ||
                  task.status ===
                    "PENDING" ||
                  task.status ===
                    "IN_PROGRESS",
              );

            return {
              ...member,
              totalTasks:
                memberTasks.length,
              pending:
                memberPending.length,
            };
          },
        ),
    );
  }

  const displayName =
    currentUser?.name?.trim() ||
    currentUser?.email?.split(
      "@",
    )[0] ||
    "User";

  const profileImage =
    currentUser?.imageUrl ||
    currentUser?.image ||
    currentUser?.profilePicture ||
    "";

  const userInitial =
    displayName
      .charAt(0)
      .toUpperCase();

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

              <SidebarLinks />
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
                    setMobileOpen(
                      true,
                    )
                  }
                  className="rounded-xl border border-[#E2E8F0] p-2.5 text-[#172033] lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={21} />
                </button>

                <div>
                  <p className="text-sm font-semibold text-[#172033]">
                    Dashboard
                  </p>

                  <p className="hidden text-xs text-[#94A3B8] sm:block">
                    {currentTime ||
                      "Household overview"}
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
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition ${
                      notificationsOpen
                        ? "border-blue-200 bg-[#EFF6FF] text-[#3B82F6]"
                        : "border-[#E2E8F0] text-[#64748B] hover:border-blue-200 hover:bg-[#EFF6FF] hover:text-[#3B82F6]"
                    }`}
                    aria-label="Notifications"
                    aria-expanded={
                      notificationsOpen
                    }
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

                {/* USER */}
                {currentUser ? (
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-2 py-1.5 transition hover:border-blue-200"
                  >
                    {profileImage ? (
                      <img
                        src={
                          profileImage
                        }
                        alt={
                          displayName
                        }
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-sm font-bold text-[#3B82F6]">
                        {
                          userInitial
                        }
                      </div>
                    )}

                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-semibold">
                        {
                          displayName
                        }
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
          <div className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">
              {/* ERROR */}
              {householdError && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {householdError}
                </div>
              )}

              {tasksError && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {tasksError}
                </div>
              )}

              {/* WELCOME */}
              <section className="dashboard-section">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#3B82F6]">
                  {householdLoading
                    ? "Your household"
                    : householdName ||
                      "Your household"}
                </p>

                <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {currentUser
                        ? `Welcome back, ${displayName} 👋`
                        : "Welcome to HomeSync 👋"}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                      Stay on top of your
                      responsibilities and
                      keep your household
                      running smoothly.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/tasks"
                    className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-[#3B82F6] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:bg-[#2563EB]"
                  >
                    <ListChecks size={18} />
                    Manage Tasks
                  </Link>
                </div>
              </section>

              {/* HOUSEHOLD INFO */}
              {!householdLoading &&
                householdName && (
                  <section className="mt-8">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                            <Home size={21} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#94A3B8]">
                              Household
                            </p>

                            <p className="mt-1 truncate text-base font-bold">
                              {
                                householdName
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                            <KeyRoundIcon />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#94A3B8]">
                              Invitation Code
                            </p>

                            <p className="mt-1 truncate text-base font-bold tracking-wider">
                              {
                                invitationCode
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

              {/* HOUSEHOLD MEMBERS */}
              <section className="mt-10">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      Household Members
                    </h2>

                    <p className="mt-1 text-sm text-[#64748B]">
                      See how responsibilities
                      are distributed.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/members"
                    className="hidden items-center gap-1 text-sm font-semibold text-[#3B82F6] sm:flex"
                  >
                    View members
                    <ChevronRight size={16} />
                  </Link>
                </div>

                {householdLoading ? (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                    <p className="mt-3 text-sm font-medium text-[#64748B]">
                      Loading household
                      members...
                    </p>
                  </div>
                ) : members.length > 0 ? (
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                    }}
                  >
                    {members.map(
                      (member) => {
                        const memberInitial =
                          member.name
                            .charAt(0)
                            .toUpperCase();

                        return (
                          <div
                            key={
                              member.id
                            }
                            className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
                          >
                            <div className="flex items-center gap-4">
                              {member.image ? (
                                <img
                                  src={
                                    member.image
                                  }
                                  alt={
                                    member.name
                                  }
                                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#EFF6FF]"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-lg font-bold text-[#3B82F6] ring-2 ring-[#EFF6FF]">
                                  {
                                    memberInitial
                                  }
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="truncate text-sm font-bold">
                                    {
                                      member.name
                                    }
                                  </h3>

                                  {member.role ===
                                    "OWNER" && (
                                    <span className="shrink-0 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3B82F6]">
                                      Owner
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 truncate text-xs text-[#94A3B8]">
                                  {
                                    member.email
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 divide-x divide-[#E2E8F0]">
                              <div>
                                <p className="text-2xl font-bold text-[#172033]">
                                  {
                                    member.totalTasks
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#64748B]">
                                  Total Tasks
                                </p>
                              </div>

                              <div className="pl-5">
                                <p className="text-2xl font-bold text-[#D97706]">
                                  {
                                    member.pending
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#64748B]">
                                  Pending
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center">
                    <Users
                      size={30}
                      className="mx-auto text-[#CBD5E1]"
                    />

                    <p className="mt-3 text-sm font-semibold text-[#64748B]">
                      No household
                      members yet
                    </p>

                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Members will appear
                      here once they are
                      added.
                    </p>
                  </div>
                )}
              </section>

              {/* MY TASKS */}
              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-lg font-bold">
                    My Tasks
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    Your assigned household
                    responsibilities at a
                    glance.
                  </p>
                </div>

                {tasksLoading ? (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6]" />

                    <p className="mt-3 text-sm font-medium text-[#64748B]">
                      Loading your tasks...
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-4">
                    {statusColumns.map(
                      (column) => {
                        const tasks =
                          myTasks.filter(
                            (task) =>
                              task.status ===
                              column.key,
                          );

                        return (
                          <div
                            key={
                              column.key
                            }
                            className="min-h-[250px] rounded-2xl border border-[#E2E8F0] bg-white p-4"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${column.dot}`}
                                />

                                <h3
                                  className={`text-sm font-bold ${column.color}`}
                                >
                                  {
                                    column.title
                                  }
                                </h3>
                              </div>

                              <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                                {
                                  tasks.length
                                }
                              </span>
                            </div>

                            <div className="space-y-3">
                              {tasks.map(
                                (task) => (
                                  <Link
                                    href={`/dashboard/tasks?task=${encodeURIComponent(
                                      task.id,
                                    )}`}
                                    key={
                                      task.id
                                    }
                                    className="block rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition hover:border-blue-200 hover:bg-[#EFF6FF]/50"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <h4 className="text-sm font-semibold leading-5">
                                        {
                                          task.title
                                        }
                                      </h4>

                                      <ChevronRight
                                        size={
                                          16
                                        }
                                        className="mt-0.5 shrink-0 text-[#94A3B8]"
                                      />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <span className="rounded-md bg-[#EFF6FF] px-2 py-1 text-[11px] font-semibold text-[#3B82F6]">
                                        {
                                          task.type
                                        }
                                      </span>

                                      <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                                        <Clock3
                                          size={
                                            13
                                          }
                                        />
                                        {
                                          task.minutes
                                        }{" "}
                                        min
                                      </span>
                                    </div>

                                    <div className="mt-3 border-t border-[#E2E8F0] pt-3">
                                      <p className="text-[11px] text-[#94A3B8]">
                                        {
                                          task.due
                                        }
                                      </p>
                                    </div>
                                  </Link>
                                ),
                              )}

                              {tasks.length ===
                                0 && (
                                <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] text-center">
                                  <CheckCircle2
                                    size={
                                      24
                                    }
                                    className="text-[#CBD5E1]"
                                  />

                                  <p className="mt-2 text-xs font-medium text-[#64748B]">
                                    No tasks
                                    yet
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </section>

              {/* HOUSEHOLD OVERVIEW */}
              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-lg font-bold">
                    Household Overview
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    A quick look at your
                    household activity and
                    progress.
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* LEFT COLUMN */}
                  <div className="space-y-5">
                    {/* WORKLOAD */}
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#64748B]">
                            Workload Overview
                          </p>

                          <p className="mt-2 text-3xl font-bold text-[#172033]">
                            {
                              totalTasks
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#94A3B8]">
                            Total assigned
                            tasks
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                          <ListChecks
                            size={21}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">
                            Household
                            workload
                          </span>

                          <span className="font-semibold text-[#172033]">
                            {totalTasks >
                            0
                              ? `${totalTasks} task${
                                  totalTasks ===
                                  1
                                    ? ""
                                    : "s"
                                }`
                              : "0%"}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
                            style={{
                              width:
                                totalTasks >
                                0
                                  ? "100%"
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* COMPLETED TASKS */}
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#64748B]">
                            Completed Tasks
                          </p>

                          <p className="mt-2 text-3xl font-bold text-[#172033]">
                            {
                              completedTasks
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#94A3B8]">
                            Completed today
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                          <CheckCircle2
                            size={21}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#64748B]">
                          {
                            completedTasks
                          }{" "}
                          completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-5">
                    {/* TODAY'S PROGRESS */}
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#64748B]">
                            Today&apos;s
                            Progress
                          </p>

                          <p className="mt-2 text-3xl font-bold text-[#172033]">
                            {
                              progressPercentage
                            }
                            %
                          </p>

                          <p className="mt-1 text-xs text-[#94A3B8]">
                            Household
                            completion
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                          <CheckCircle2
                            size={21}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">
                            Completed today
                          </span>

                          <span className="font-semibold text-[#172033]">
                            {
                              completedTasks
                            }{" "}
                            / {totalTasks}
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
                            style={{
                              width: `${progressPercentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PENDING TASKS */}
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#64748B]">
                            Pending Tasks
                          </p>

                          <p className="mt-2 text-3xl font-bold text-[#172033]">
                            {
                              pendingTasks
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#94A3B8]">
                            Tasks remaining
                            today
                          </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#D97706]">
                          <Clock3
                            size={21}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#64748B]">
                          {pendingTasks}{" "}
                          remaining
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* QUICK ACTIONS */}
              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-lg font-bold">
                    Quick Actions
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    Manage your household
                    from one place.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {quickActions.map(
                    (action) => {
                      const Icon =
                        action.icon;

                      return (
                        <Link
                          key={
                            action.title
                          }
                          href={
                            action.href
                          }
                          className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6] transition group-hover:bg-[#3B82F6] group-hover:text-white">
                              <Icon
                                size={21}
                              />
                            </div>

                            <ChevronRight
                              size={18}
                              className="text-[#CBD5E1] transition group-hover:translate-x-1 group-hover:text-[#3B82F6]"
                            />
                          </div>

                          <h3 className="mt-5 text-sm font-bold">
                            {
                              action.title
                            }
                          </h3>

                          <p className="mt-2 text-xs leading-5 text-[#64748B]">
                            {
                              action.description
                            }
                          </p>
                        </Link>
                      );
                    },
                  )}
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
                    Share the work. Balance
                    the home.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#64748B]">
                ©{" "}
                {new Date().getFullYear()}{" "}
                HomeSync. All rights
                reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function KeyRoundIcon() {
  return (
    <span className="text-[18px] font-bold tracking-widest">
      #
    </span>
  );
}

function Logo() {
  return (
    <Link
      href="/landing"
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
            Share responsibilities and
            keep your household organized.
          </p>
        </div>
      </div>
    </>
  );
}

function SidebarLinks() {
  const links = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: true,
    },
    {
      title: "Tasks",
      href: "/dashboard/tasks",
      icon: ListChecks,
      active: false,
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