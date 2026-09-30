import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("homesync-token")?.value ||
    cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const authUser = await verifyAuthToken(token);

  if (!authUser) {
    return null;
  }

  return authUser;
}

async function getUserHousehold(userId: string) {
  return prisma.householdMember.findFirst({
    where: {
      userId,
    },
    select: {
      householdId: true,
      role: true,
    },
  });
}

// ======================================================
// GET /api/reminders
// ======================================================

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        {
          message: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const householdMembership =
      await getUserHousehold(authUser.userId);

    if (!householdMembership) {
      return NextResponse.json(
        {
          message:
            "You are not a member of any household.",
        },
        {
          status: 404,
        }
      );
    }

    const reminders =
      await prisma.reminder.findMany({
        where: {
          OR: [
            {
              type: "PERSONAL",
              userId: authUser.userId,
            },
            {
              type: "HOUSEHOLD",
              householdId:
                householdMembership.householdId,
            },
          ],
        },
        orderBy: [
          {
            date: "asc",
          },
          {
            time: "asc",
          },
        ],
      });

    /*
     * IMPORTANT: Convert each reminder's date (DateTime stored in DB)
     * back to a YYYY-MM-DD string using UTC methods.
     * This prevents any timezone shift when the frontend displays the date.
     *
     * The DB stores dates as UTC midnight (e.g. 2026-09-30T00:00:00Z),
     * so getUTCFullYear/Month/Date gives the correct calendar date.
     */
    const serializedReminders = reminders.map((reminder) => {
      const d = new Date(reminder.date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      return {
        ...reminder,
        date: dateString,
        createdAt: reminder.createdAt.toISOString(),
        updatedAt: reminder.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      reminders: serializedReminders,
    });
  } catch (error) {
    console.error(
      "GET_REMINDERS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Unable to load reminders.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// POST /api/reminders
// ======================================================

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        {
          message: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const householdMembership =
      await getUserHousehold(authUser.userId);

    if (!householdMembership) {
      return NextResponse.json(
        {
          message:
            "You are not a member of any household.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const date =
      typeof body.date === "string"
        ? body.date.trim()
        : "";

    const time =
      typeof body.time === "string"
        ? body.time.trim()
        : "";

    const type =
      body.type === "HOUSEHOLD"
        ? "HOUSEHOLD"
        : "PERSONAL";

    if (!title) {
      return NextResponse.json(
        {
          message:
            "Reminder title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!date) {
      return NextResponse.json(
        {
          message:
            "Reminder date is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!time) {
      return NextResponse.json(
        {
          message:
            "Reminder time is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * FIX: Date Timezone Bug
     *
     * WRONG (causes one-day shift in timezones east of UTC):
     *   new Date(`${date}T00:00:00`)
     *   new Date(date)
     *
     * CORRECT: Parse as explicit UTC midnight using Date.UTC().
     * This ensures "2026-09-30" is stored as 2026-09-30T00:00:00.000Z
     * in PostgreSQL, and when read back with getUTCDate() it returns 30.
     */
    const [year, month, day] = date.split("-").map(Number);

    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      return NextResponse.json(
        {
          message:
            "Invalid reminder date.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          message:
            "Invalid reminder date.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // CREATE REMINDER
    // ==================================================

    const reminder =
      await prisma.reminder.create({
        data: {
          userId: authUser.userId,

          householdId:
            householdMembership.householdId,

          title,

          description:
            description || null,

          date: parsedDate,

          time,

          type,
        },
      });

    // ==================================================
    // FIND NOTIFICATION RECIPIENTS
    // ==================================================

    let recipientUserIds: string[] = [];

    if (type === "PERSONAL") {
      // Personal reminder:
      // Only the person who created it receives
      // the notification.

      recipientUserIds = [
        authUser.userId,
      ];
    } else {
      // Household reminder:
      // Every household member receives
      // the notification.

      const householdMembers =
        await prisma.householdMember.findMany({
          where: {
            householdId:
              householdMembership.householdId,
          },
          select: {
            userId: true,
          },
        });

      recipientUserIds =
        householdMembers.map(
          (member) => member.userId
        );
    }

    // ==================================================
    // CREATE NOTIFICATIONS
    // ==================================================

    if (recipientUserIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientUserIds.map(
          (userId) => ({
            userId,

            householdId:
              householdMembership.householdId,

            type: "REMINDER",

            title:
              type === "HOUSEHOLD"
                ? "Household Reminder"
                : "Personal Reminder",

            message: description
              ? `${title} — ${description}`
              : title,

            isRead: false,
          })
        ),
      });
    }

    // Return serialized reminder with date as YYYY-MM-DD string
    const d = new Date(reminder.date);
    const yr = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dy = String(d.getUTCDate()).padStart(2, "0");

    return NextResponse.json(
      {
        success: true,
        message:
          "Reminder created successfully.",
        reminder: {
          ...reminder,
          date: `${yr}-${mo}-${dy}`,
          createdAt: reminder.createdAt.toISOString(),
          updatedAt: reminder.updatedAt.toISOString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST_REMINDER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to create reminder.",
      },
      {
        status: 500,
      }
    );
  }
}