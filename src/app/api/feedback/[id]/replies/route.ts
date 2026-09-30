import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const authUser =
      await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        { message: "Invalid or expired session." },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const membership =
      await prisma.householdMember.findFirst({
        where: {
          userId: authUser.userId,
        },
        select: {
          householdId: true,
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          message:
            "You are not a member of any household.",
        },
        { status: 404 },
      );
    }

    const feedback =
      await prisma.feedback.findFirst({
        where: {
          id,
          householdId:
            membership.householdId,
        },
        select: {
          id: true,
        },
      });

    if (!feedback) {
      return NextResponse.json(
        { message: "Feedback not found." },
        { status: 404 },
      );
    }

    const replies =
      await prisma.feedbackReply.findMany({
        where: {
          feedbackId: feedback.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      replies,
    });
  } catch (error) {
    console.error(
      "GET_FEEDBACK_REPLIES_ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load feedback replies.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const authUser =
      await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        { message: "Invalid or expired session." },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const membership =
      await prisma.householdMember.findFirst({
        where: {
          userId: authUser.userId,
        },
        select: {
          householdId: true,
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          message:
            "You are not a member of any household.",
        },
        { status: 404 },
      );
    }

    const feedback =
      await prisma.feedback.findFirst({
        where: {
          id,
          householdId:
            membership.householdId,
        },
        select: {
          id: true,
          userId: true,
        },
      });

    if (!feedback) {
      return NextResponse.json(
        { message: "Feedback not found." },
        { status: 404 },
      );
    }

    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          message:
            "Reply message is required.",
        },
        { status: 400 },
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        {
          message:
            "Reply cannot exceed 1000 characters.",
        },
        { status: 400 },
      );
    }

    const reply =
      await prisma.feedbackReply.create({
        data: {
          feedbackId: feedback.id,
          userId: authUser.userId,
          message,
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      });

    // Notify the original feedback author.
    if (
      feedback.userId &&
      feedback.userId !== authUser.userId
    ) {
      await prisma.notification.create({
        data: {
          userId: feedback.userId,
          householdId:
            membership.householdId,
          type: "FEEDBACK_ACTIVITY",
          title: "Feedback Reply",
          message:
            "Someone replied to your household feedback.",
          isRead: false,
        },
      });
    }

    // Notify the other household members.
    const otherMembers =
      await prisma.householdMember.findMany({
        where: {
          householdId:
            membership.householdId,
          userId: {
            not: authUser.userId,
          },
        },
        select: {
          userId: true,
        },
      });

    const recipients =
      otherMembers
        .map((member) => member.userId)
        .filter(
          (userId) =>
            userId !== feedback.userId,
        );

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map(
          (userId) => ({
            userId,
            householdId:
              membership.householdId,
            type: "FEEDBACK_ACTIVITY",
            title: "Feedback Reply",
            message:
              "A household member replied to feedback.",
            isRead: false,
          }),
        ),
      });
    }

    return NextResponse.json(
      {
        success: true,
        reply,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST_FEEDBACK_REPLY_ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to submit reply.",
      },
      { status: 500 },
    );
  }
}