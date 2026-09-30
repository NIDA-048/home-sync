import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

async function getAccessibleReminder(
  reminderId: string,
  userId: string
) {
  const householdMembership =
    await getUserHousehold(userId);

  if (!householdMembership) {
    return null;
  }

  return prisma.reminder.findFirst({
    where: {
      id: reminderId,
      OR: [
        {
          type: "PERSONAL",
          userId,
        },
        {
          type: "HOUSEHOLD",
          householdId:
            householdMembership.householdId,
        },
      ],
    },
  });
}

// ======================================================
// GET /api/reminders/[id]
// ======================================================

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const authUser =
      await getAuthenticatedUser();

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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Reminder ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const reminder =
      await getAccessibleReminder(
        id,
        authUser.userId
      );

    if (!reminder) {
      return NextResponse.json(
        {
          message:
            "Reminder not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error) {
    console.error(
      "GET_REMINDER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to load reminder.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// PATCH /api/reminders/[id]
// ======================================================

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const authUser =
      await getAuthenticatedUser();

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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Reminder ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const reminder =
      await getAccessibleReminder(
        id,
        authUser.userId
      );

    if (!reminder) {
      return NextResponse.json(
        {
          message:
            "Reminder not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Only the creator can edit a reminder.
    if (
      reminder.userId !==
      authUser.userId
    ) {
      return NextResponse.json(
        {
          message:
            "You can only edit reminders created by you.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const data: {
      title?: string;
      description?: string | null;
      date?: Date;
      time?: string;
      type?: "PERSONAL" | "HOUSEHOLD";
    } = {};

    // ==================================================
    // TITLE
    // ==================================================

    if (
      body.title !== undefined
    ) {
      if (
        typeof body.title !==
        "string"
      ) {
        return NextResponse.json(
          {
            message:
              "Reminder title must be text.",
          },
          {
            status: 400,
          }
        );
      }

      const title =
        body.title.trim();

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

      data.title = title;
    }

    // ==================================================
    // DESCRIPTION
    // ==================================================

    if (
      body.description !==
      undefined
    ) {
      if (
        body.description ===
        null
      ) {
        data.description = null;
      } else if (
        typeof body.description ===
        "string"
      ) {
        const description =
          body.description.trim();

        data.description =
          description || null;
      } else {
        return NextResponse.json(
          {
            message:
              "Reminder description must be text.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ==================================================
    // DATE
    // ==================================================

    if (
      body.date !== undefined
    ) {
      if (
        typeof body.date !==
        "string"
      ) {
        return NextResponse.json(
          {
            message:
              "Reminder date must be text.",
          },
          {
            status: 400,
          }
        );
      }

      const date =
        body.date.trim();

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

      /*
       * FIX: Date Timezone Bug
       * Use Date.UTC() to ensure correct UTC midnight storage.
       * This prevents the one-day shift in Pakistan (+5) timezone.
       */
      const dateParts = date.split("-").map(Number);
      const [dateYear, dateMonth, dateDay] = dateParts;

      if (
        !dateYear ||
        !dateMonth ||
        !dateDay ||
        isNaN(dateYear) ||
        isNaN(dateMonth) ||
        isNaN(dateDay)
      ) {
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

      const parsedDate = new Date(
        Date.UTC(dateYear, dateMonth - 1, dateDay, 0, 0, 0, 0)
      );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
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

      data.date = parsedDate;
    }

    // ==================================================
    // TIME
    // ==================================================

    if (
      body.time !== undefined
    ) {
      if (
        typeof body.time !==
        "string"
      ) {
        return NextResponse.json(
          {
            message:
              "Reminder time must be text.",
          },
          {
            status: 400,
          }
        );
      }

      const time =
        body.time.trim();

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

      data.time = time;
    }

    // ==================================================
    // TYPE
    // ==================================================

    if (
      body.type !== undefined
    ) {
      if (
        body.type !==
          "PERSONAL" &&
        body.type !==
          "HOUSEHOLD"
      ) {
        return NextResponse.json(
          {
            message:
              "Invalid reminder type.",
          },
          {
            status: 400,
          }
        );
      }

      data.type = body.type;
    }

    // ==================================================
    // UPDATE REMINDER
    // ==================================================

    const updatedReminder =
      await prisma.reminder.update({
        where: {
          id: reminder.id,
        },
        data,
      });

    // ==================================================
    // HANDLE NOTIFICATIONS
    // ==================================================

    // Remove old reminder notifications
    // related to this reminder is not possible
    // because Notification currently does not
    // have a relatedReminderId field.
    //
    // Therefore we create fresh notifications
    // for the updated reminder.

    const notificationType =
      "REMINDER";

    let recipientUserIds: string[] =
      [];

    if (
      updatedReminder.type ===
      "PERSONAL"
    ) {
      recipientUserIds = [
        updatedReminder.userId,
      ];
    } else {
      const householdMembership =
        await getUserHousehold(
          authUser.userId
        );

      if (
        householdMembership
      ) {
        const householdMembers =
          await prisma.householdMember.findMany(
            {
              where: {
                householdId:
                  householdMembership.householdId,
              },
              select: {
                userId: true,
              },
            }
          );

        recipientUserIds =
          householdMembers.map(
            (member) =>
              member.userId
          );
      }
    }

    if (
      recipientUserIds.length > 0
    ) {
      const message =
        updatedReminder.description
          ? `${updatedReminder.title} — ${updatedReminder.description}`
          : updatedReminder.title;

      await prisma.notification.createMany(
        {
          data: recipientUserIds.map(
            (userId) => ({
              userId,

              householdId:
                updatedReminder.householdId,

              type: notificationType,

              title:
                updatedReminder.type ===
                "HOUSEHOLD"
                  ? "Household Reminder Updated"
                  : "Personal Reminder Updated",

              message,

              isRead: false,
            })
          ),
        }
      );
    }

    // Serialize date as YYYY-MM-DD using UTC methods to avoid timezone shift
    const updRaw = new Date(updatedReminder.date);
    const updYear = updRaw.getUTCFullYear();
    const updMonth = String(updRaw.getUTCMonth() + 1).padStart(2, "0");
    const updDay = String(updRaw.getUTCDate()).padStart(2, "0");

    return NextResponse.json({
      success: true,
      message:
        "Reminder updated successfully.",
      reminder: {
        ...updatedReminder,
        date: `${updYear}-${updMonth}-${updDay}`,
        createdAt: updatedReminder.createdAt.toISOString(),
        updatedAt: updatedReminder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "PATCH_REMINDER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to update reminder.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// DELETE /api/reminders/[id]
// ======================================================

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const authUser =
      await getAuthenticatedUser();

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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message:
            "Reminder ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const reminder =
      await getAccessibleReminder(
        id,
        authUser.userId
      );

    if (!reminder) {
      return NextResponse.json(
        {
          message:
            "Reminder not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Only the creator can delete
    // the reminder.

    if (
      reminder.userId !==
      authUser.userId
    ) {
      return NextResponse.json(
        {
          message:
            "You can only delete reminders created by you.",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.reminder.delete({
      where: {
        id: reminder.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Reminder deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE_REMINDER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to delete reminder.",
      },
      {
        status: 500,
      }
    );
  }
}