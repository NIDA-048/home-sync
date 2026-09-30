import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const authUser = await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        {
          message: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
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
    console.error("DELETE_NOTIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to delete notification.",
      },
      { status: 500 }
    );
  }
}