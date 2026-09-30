import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

/* =========================================================
   TYPES & VALIDATION
========================================================= */

type AuthUser = {
  id: string;
  email?: string;
};

const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Task title is required"),

  description: z
    .string()
    .optional()
    .nullable(),

  rule: z.enum([
    "TEMPORARY",
    "RECURRING",
    "PERMANENT",
  ]),

  assignmentMode: z.enum([
    "ALL",
    "SELECTED",
    "PERMANENT",
  ]),

  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .default("MEDIUM"),

  frequency: z
    .enum([
      "DAILY",
      "EVERY_2_DAYS",
      "EVERY_3_DAYS",
      "WEEKLY",
      "EVERY_2_WEEKS",
      "CUSTOM",
    ])
    .optional()
    .nullable(),

  customDays: z
    .array(z.string())
    .optional()
    .nullable(),

  scheduledDate: z
    .string()
    .optional()
    .nullable(),

  dueDate: z
    .string()
    .optional()
    .nullable(),

  estimatedMinutes: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  selectedUserIds: z
    .array(z.string())
    .optional(),

  assignedUserIds: z
    .array(z.string())
    .optional(),
});

/* =========================================================
   DATE HELPERS (UTC MIDNIGHT NORMALIZATION)
========================================================= */

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value?: string | null): string | null {
  if (!value) return null;
  const str = String(value).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const date = new Date(str);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateToUtc(value?: string | null): Date | null {
  const key = parseDateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function dateToKey(date?: Date | null): string {
  if (!date) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysBetweenUtc(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

/* =========================================================
   FREQUENCY & RECURRENCE HELPERS
========================================================= */

function normalizeDayName(value: string): string {
  return value.trim().toUpperCase();
}

function customDayMatches(date: Date, customDays: string[]): boolean {
  if (!customDays.length) return false;
  const names = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const currentDay = names[date.getUTCDay()];
  return customDays.map(normalizeDayName).includes(currentDay);
}

function shouldOccurOnDate(
  date: Date,
  frequency: string | null | undefined,
  customDays: string[],
  startDate: Date
): boolean {
  if (!frequency) return false;

  const diff = daysBetweenUtc(startDate, date);
  if (diff < 0) return false;

  switch (frequency) {
    case "DAILY":
      return true;
    case "EVERY_2_DAYS":
      return diff % 2 === 0;
    case "EVERY_3_DAYS":
      return diff % 3 === 0;
    case "WEEKLY":
      return diff % 7 === 0;
    case "EVERY_2_WEEKS":
      return diff % 14 === 0;
    case "CUSTOM":
      return customDayMatches(date, customDays);
    default:
      return false;
  }
}

/*
 * Deterministically calculates member assignment for date
 */
function calculateAssignedMember(
  startDate: Date,
  targetDate: Date,
  frequency: string,
  customDays: string[],
  eligibleUserIds: string[]
): string | null {
  if (!eligibleUserIds.length) return null;

  const diff = daysBetweenUtc(startDate, targetDate);
  if (diff < 0) return null;

  let occurrenceIndex = 0;

  switch (frequency) {
    case "DAILY":
      occurrenceIndex = diff;
      break;
    case "EVERY_2_DAYS":
      occurrenceIndex = Math.floor(diff / 2);
      break;
    case "EVERY_3_DAYS":
      occurrenceIndex = Math.floor(diff / 3);
      break;
    case "WEEKLY":
      occurrenceIndex = Math.floor(diff / 7);
      break;
    case "EVERY_2_WEEKS":
      occurrenceIndex = Math.floor(diff / 14);
      break;
    case "CUSTOM": {
      let count = 0;
      let curr = new Date(startDate);
      while (curr <= targetDate) {
        if (customDayMatches(curr, customDays)) {
          count++;
        }
        curr = addDaysUtc(curr, 1);
      }
      occurrenceIndex = Math.max(0, count - 1);
      break;
    }
    default:
      occurrenceIndex = diff;
  }

  const memberPos = occurrenceIndex % eligibleUserIds.length;
  return eligibleUserIds[memberPos];
}

/* =========================================================
   AUTH HELPER
========================================================= */

async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    let token = "";

    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      token = authorization.substring(7);
    }

    if (!token) {
      token =
        request.cookies.get("homesync-token")?.value ||
        request.cookies.get("token")?.value ||
        "";
    }

    if (!token) return null;

    const payload = await verifyAuthToken(token);
    if (!payload?.userId) return null;

    return {
      id: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

async function getUserHousehold(userId: string) {
  return prisma.householdMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true, role: true },
  });
}

async function getHouseholdMembers(householdId: string) {
  return prisma.householdMember.findMany({
    where: { householdId },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

/* =========================================================
   RECURRING OCCURRENCE GENERATION
========================================================= */

async function getRecurringTemplate(householdId: string, recurrenceGroupId: string) {
  return prisma.task.findFirst({
    where: {
      householdId,
      recurrenceGroupId,
      rule: "RECURRING",
      scheduledDate: null,
      isActive: true,
    },
    include: {
      assignments: {
        orderBy: { rotationPosition: "asc" },
        select: { id: true, userId: true, rotationPosition: true },
      },
    },
  });
}

async function createRecurringOccurrence(
  template: any,
  householdId: string,
  scheduledDate: Date,
  assignedUserId: string
) {
  const keyDate = parseDateToUtc(dateToKey(scheduledDate)) || scheduledDate;

  const existing = await prisma.task.findFirst({
    where: {
      householdId,
      recurrenceGroupId: template.recurrenceGroupId,
      scheduledDate: keyDate,
      isActive: true,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, imageUrl: true },
      },
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true, imageUrl: true } },
        },
      },
      completions: true,
      evidence: true,
    },
  });

  if (existing) return existing;

  let dueDate: Date | null = null;
  if (template.dueDate) {
    const origDue = new Date(template.dueDate);
    dueDate = new Date(keyDate);
    dueDate.setUTCHours(
      origDue.getUTCHours(),
      origDue.getUTCMinutes(),
      origDue.getUTCSeconds()
    );
  }

  try {
    return await prisma.task.create({
      data: {
        householdId,
        createdById: template.createdById,
        title: template.title,
        description: template.description,
        rule: "RECURRING",
        assignmentMode: template.assignmentMode || "SELECTED",
        difficulty: template.difficulty,
        frequency: template.frequency,
        customDays: template.customDays || [],
        scheduledDate: keyDate,
        dueDate,
        estimatedMinutes: template.estimatedMinutes,
        status: "TO_DO",
        isActive: true,
        recurrenceGroupId: template.recurrenceGroupId,
        assignments: {
          create: [
            {
              userId: assignedUserId,
              rotationPosition:
                template.assignments?.find(
                  (item: any) => item.userId === assignedUserId
                )?.rotationPosition ?? 0,
            },
          ],
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, imageUrl: true } },
          },
        },
        completions: true,
        evidence: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.task.findFirst({
        where: {
          householdId,
          recurrenceGroupId: template.recurrenceGroupId,
          scheduledDate: keyDate,
          isActive: true,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, imageUrl: true },
          },
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true, imageUrl: true } },
            },
          },
          completions: true,
          evidence: true,
        },
      });
      if (duplicate) return duplicate;
    }
    throw error;
  }
}

async function ensureRecurringOccurrences(
  householdId: string,
  recurrenceGroupId: string,
  targetDate: Date
) {
  const template = await getRecurringTemplate(householdId, recurrenceGroupId);
  if (!template || template.rule !== "RECURRING" || !template.frequency) {
    return;
  }

  let rotationMembers = uniqueIds(
    template.assignments
      .sort((a: any, b: any) => (a.rotationPosition ?? 0) - (b.rotationPosition ?? 0))
      .map((a: any) => a.userId)
  );

  if (!rotationMembers.length) {
    const members = await getHouseholdMembers(householdId);
    rotationMembers = members.map((m) => m.userId);
  }

  if (!rotationMembers.length) return;

  const firstOccurrence = await prisma.task.findFirst({
    where: {
      householdId,
      recurrenceGroupId,
      rule: "RECURRING",
      scheduledDate: { not: null },
      isActive: true,
    },
    orderBy: { scheduledDate: "asc" },
    select: { scheduledDate: true },
  });

  const startDate = firstOccurrence?.scheduledDate
    ? parseDateToUtc(dateToKey(firstOccurrence.scheduledDate)) || firstOccurrence.scheduledDate
    : parseDateToUtc(dateToKey(template.createdAt)) || parseDateToUtc(getTodayKey())!;

  let cursor = new Date(startDate);
  const endLimit = parseDateToUtc(dateToKey(targetDate)) || targetDate;

  let safety = 0;
  while (cursor <= endLimit && safety < 1000) {
    safety++;

    const occurs = shouldOccurOnDate(
      cursor,
      template.frequency,
      template.customDays || [],
      startDate
    );

    if (occurs) {
      const assignedUser = calculateAssignedMember(
        startDate,
        cursor,
        template.frequency,
        template.customDays || [],
        rotationMembers
      );

      if (assignedUser) {
        await createRecurringOccurrence(
          template,
          householdId,
          new Date(cursor),
          assignedUser
        );
      }
    }

    if (template.frequency === "CUSTOM") {
      cursor = addDaysUtc(cursor, 1);
    } else if (template.frequency === "DAILY") {
      cursor = addDaysUtc(cursor, 1);
    } else if (template.frequency === "EVERY_2_DAYS") {
      cursor = addDaysUtc(cursor, 2);
    } else if (template.frequency === "EVERY_3_DAYS") {
      cursor = addDaysUtc(cursor, 3);
    } else if (template.frequency === "WEEKLY") {
      cursor = addDaysUtc(cursor, 7);
    } else if (template.frequency === "EVERY_2_WEEKS") {
      cursor = addDaysUtc(cursor, 14);
    } else {
      cursor = addDaysUtc(cursor, 1);
    }
  }
}

async function backfillOldRecurringGroups(householdId: string) {
  const oldTasks = await prisma.task.findMany({
    where: {
      householdId,
      rule: "RECURRING",
      recurrenceGroupId: null,
      isActive: true,
    },
    select: { id: true },
  });

  for (const task of oldTasks) {
    await prisma.task.update({
      where: { id: task.id },
      data: { recurrenceGroupId: crypto.randomUUID() },
    });
  }
}

/* =========================================================
   GET TASKS
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const household = await getUserHousehold(user.id);
    if (!household) {
      return NextResponse.json(
        { success: false, message: "You are not a member of any household." },
        { status: 400 }
      );
    }

    await backfillOldRecurringGroups(household.householdId);

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    const targetDateKey = parseDateKey(dateParam) || getTodayKey();
    const targetDate = parseDateToUtc(targetDateKey)!;

    const templates = await prisma.task.findMany({
      where: {
        householdId: household.householdId,
        rule: "RECURRING",
        recurrenceGroupId: { not: null },
        scheduledDate: null,
        isActive: true,
      },
      select: { recurrenceGroupId: true },
    });

    for (const template of templates) {
      if (template.recurrenceGroupId) {
        await ensureRecurringOccurrences(
          household.householdId,
          template.recurrenceGroupId,
          targetDate
        );
      }
    }

    const tasks = await prisma.task.findMany({
      where: {
        householdId: household.householdId,
        isActive: true,
        scheduledDate: { not: null },
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        assignments: {
          orderBy: { rotationPosition: "asc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, imageUrl: true },
            },
          },
        },
        completions: true,
        evidence: true,
        rotation: true,
      },
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("GET_TASKS_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load tasks." },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST TASK
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const household = await getUserHousehold(user.id);
    if (!household) {
      return NextResponse.json(
        { success: false, message: "You are not a member of any household." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = taskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid task data.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const householdMembers = await getHouseholdMembers(household.householdId);
    const householdUserIds = householdMembers.map((m) => m.userId);

    const requestedIds = uniqueIds(
      data.assignedUserIds ?? data.selectedUserIds ?? []
    ).filter((id) => householdUserIds.includes(id));

    const scheduledDateKey = parseDateKey(data.scheduledDate) || getTodayKey();
    const scheduledDate = parseDateToUtc(scheduledDateKey)!;
    const dueDate = parseDateToUtc(data.dueDate);

    /* =====================================================
       RECURRING
    ===================================================== */
    if (data.rule === "RECURRING") {
      if (!data.frequency) {
        return NextResponse.json(
          { success: false, message: "Please select a recurring frequency." },
          { status: 400 }
        );
      }

      if (
        data.frequency === "CUSTOM" &&
        (!data.customDays || data.customDays.length === 0)
      ) {
        return NextResponse.json(
          { success: false, message: "Please select at least one custom day." },
          { status: 400 }
        );
      }

      let rotationUserIds: string[] = [];
      if (data.assignmentMode === "ALL") {
        rotationUserIds = householdUserIds;
      } else {
        rotationUserIds = requestedIds;
      }

      if (rotationUserIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Please select at least one member for the recurring rotation.",
          },
          { status: 400 }
        );
      }

      const recurrenceGroupId = crypto.randomUUID();

      const template = await prisma.task.create({
        data: {
          householdId: household.householdId,
          createdById: user.id,
          title: data.title.trim(),
          description: data.description || null,
          rule: "RECURRING",
          assignmentMode: data.assignmentMode,
          difficulty: data.difficulty,
          frequency: data.frequency,
          customDays: data.customDays || [],
          scheduledDate: null,
          dueDate,
          estimatedMinutes: data.estimatedMinutes || null,
          status: "TO_DO",
          isActive: true,
          recurrenceGroupId,
          assignments: {
            create: rotationUserIds.map((userId, index) => ({
              userId,
              rotationPosition: index,
            })),
          },
        },
      });

      const occurs = shouldOccurOnDate(
        scheduledDate,
        data.frequency,
        data.customDays || [],
        scheduledDate
      );

      if (occurs) {
        const assignedUser = calculateAssignedMember(
          scheduledDate,
          scheduledDate,
          data.frequency,
          data.customDays || [],
          rotationUserIds
        ) || rotationUserIds[0];

        await createRecurringOccurrence(
          template,
          household.householdId,
          scheduledDate,
          assignedUser
        );
      }

      await ensureRecurringOccurrences(
        household.householdId,
        recurrenceGroupId,
        scheduledDate > parseDateToUtc(getTodayKey())!
          ? scheduledDate
          : parseDateToUtc(getTodayKey())!
      );

      const visibleTask = await prisma.task.findFirst({
        where: {
          householdId: household.householdId,
          recurrenceGroupId,
          scheduledDate: { not: null },
          isActive: true,
        },
        orderBy: { scheduledDate: "asc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, imageUrl: true },
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, imageUrl: true },
              },
            },
          },
          completions: true,
          evidence: true,
        },
      });

      // Notify rotation members (excluding creator) about the recurring task
      const recurringAssigneesToNotify = rotationUserIds.filter((uid) => uid !== user.id);
      if (recurringAssigneesToNotify.length > 0) {
        await prisma.notification.createMany({
          data: recurringAssigneesToNotify.map((userId) => ({
            userId,
            householdId: household.householdId,
            type: "TASK_ASSIGNED" as const,
            title: "Recurring Task Assigned",
            message: `You are in the rotation for "${data.title.trim()}".`,
            isRead: false,
            relatedTaskId: visibleTask?.id ?? undefined,
          })),
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "Recurring task created successfully.",
          task: visibleTask,
          recurrenceGroupId,
        },
        { status: 201 }
      );
    }

    /* =====================================================
       PERMANENT / TEMPORARY
    ===================================================== */
    let assignedUserIds = requestedIds;

    if (data.assignmentMode === "ALL") {
      assignedUserIds = householdUserIds;
    } else if (assignedUserIds.length === 0) {
      assignedUserIds = [user.id];
    }

    const newTask = await prisma.task.create({
      data: {
        householdId: household.householdId,
        createdById: user.id,
        title: data.title.trim(),
        description: data.description || null,
        rule: data.rule,
        assignmentMode: data.assignmentMode,
        difficulty: data.difficulty,
        scheduledDate,
        dueDate,
        estimatedMinutes: data.estimatedMinutes || null,
        status: "TO_DO",
        isActive: true,
        assignments: {
          create: assignedUserIds.map((userId, index) => ({
            userId,
            rotationPosition: index,
          })),
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, imageUrl: true },
            },
          },
        },
        completions: true,
        evidence: true,
      },
    });

    // Create TASK_ASSIGNED notifications for assigned members (excluding the creator)
    const assigneesToNotify = assignedUserIds.filter((uid) => uid !== user.id);

    if (assigneesToNotify.length > 0) {
      await prisma.notification.createMany({
        data: assigneesToNotify.map((userId) => ({
          userId,
          householdId: household.householdId,
          type: "TASK_ASSIGNED" as const,
          title: "Task Assigned",
          message: `You have been assigned "${newTask.title}".`,
          isRead: false,
          relatedTaskId: newTask.id,
        })),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully.",
        task: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST_TASK_ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create task." },
      { status: 500 }
    );
  }
}