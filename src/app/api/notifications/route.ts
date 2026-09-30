import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("homesync-token")?.value ||
    cookieStore.get("token")?.value;

  if (!token) return null;

  const authUser = await verifyAuthToken(token);
  return authUser ?? null;
}

// ======================================================
// GET /api/notifications
// Returns ALL notification types for the authenticated user.
// NO filtering by type — task, feedback, reminder, general all included.
// ======================================================

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: authUser.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        let feedback = null;
        let task = null;

        if (notification.relatedFeedbackId) {
          feedback = await prisma.feedback.findUnique({
            where: {
              id: notification.relatedFeedbackId,
            },
            select: {
              id: true,
              category: true,
              message: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              replies: {
                orderBy: {
                  createdAt: "asc",
                },
                select: {
                  id: true,
                  message: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          });
        }

        if (notification.relatedTaskId) {
          task = await prisma.task.findUnique({
            where: {
              id: notification.relatedTaskId,
            },
            select: {
              id: true,
              title: true,
              description: true,
              rule: true,
              frequency: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        }

        return {
          id: notification.id,
          userId: notification.userId,
          householdId: notification.householdId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          relatedTaskId: notification.relatedTaskId,
          relatedFeedbackId: notification.relatedFeedbackId,
          createdAt: notification.createdAt,
          feedback,
          task,
        };
      })
    );

    const unreadCount = notificationsWithDetails.filter((n) => !n.isRead).length;

    /*
     * Return { notifications, unreadCount } so the calendar page can access
     * data.notifications consistently.
     */
    return NextResponse.json({
      notifications: notificationsWithDetails,
      unreadCount,
    });
  } catch (error) {
    console.error("GET_NOTIFICATIONS_ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to load notifications.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH /api/notifications
// Mark single or all notifications as read.
// ======================================================

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (body.markAllRead === true) {
      await prisma.notification.updateMany({
        where: {
          userId: authUser.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (body.notificationId) {
      const notification = await prisma.notification.findFirst({
        where: {
          id: String(body.notificationId),
          userId: authUser.userId,
        },
      });

      if (!notification) {
        return NextResponse.json(
          {
            message: "Notification not found.",
          },
          { status: 404 }
        );
      }

      const updatedNotification = await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        success: true,
        notification: updatedNotification,
      });
    }

    return NextResponse.json(
      {
        message: "Invalid notification request.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH_NOTIFICATIONS_ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to update notification.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE /api/notifications
// Delete a specific notification by ID (passed in body).
// Also supports the path-based /api/notifications/[id] DELETE.
// ======================================================

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const notificationId = body?.notificationId;

    if (!notificationId) {
      return NextResponse.json(
        { message: "Notification ID is required." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: String(notificationId),
        userId: authUser.userId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found." },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: {
        id: notification.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE_NOTIFICATIONS_ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to delete notification.",
      },
      { status: 500 }
    );
  }
}