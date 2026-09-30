import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

function normalizeCategory(value: unknown) {
  const category = String(value ?? "")
    .trim()
    .toUpperCase();

  const allowed = [
    "HOUSEHOLD",
    "TASKS",
    "FAIRNESS",
    "SUGGESTIONS",
    "OTHER",
  ];

  return allowed.includes(category) ? category : null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const authUser = await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        {
          message: "Invalid or expired session.",
        },
        { status: 401 },
      );
    }

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
          message: "You are not a member of any household.",
        },
        { status: 404 },
      );
    }

    const feedback =
      await prisma.feedback.findMany({
        where: {
          householdId:
            membership.householdId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          category: true,
          message: true,
          status: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      feedback,
    });
  } catch (error) {
    console.error(
      "GET_FEEDBACK_ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to load feedback.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const authUser = await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        {
          message: "Invalid or expired session.",
        },
        { status: 401 },
      );
    }

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
          message: "You are not a member of any household.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const category =
      normalizeCategory(body?.category);

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!category) {
      return NextResponse.json(
        {
          message: "Invalid feedback category.",
        },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          message: "Feedback message is required.",
        },
        { status: 400 },
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        {
          message:
            "Feedback message cannot exceed 1000 characters.",
        },
        { status: 400 },
      );
    }

    const feedback =
      await prisma.feedback.create({
        data: {
          householdId:
            membership.householdId,
          userId: authUser.userId,
          category:
            category as
              | "HOUSEHOLD"
              | "TASKS"
              | "FAIRNESS"
              | "SUGGESTIONS"
              | "OTHER",
          message,
          status: "NEW",
        },
        select: {
          id: true,
          category: true,
          message: true,
          status: true,
          createdAt: true,
        },
      });

    /*
     * Create a notification for the other household members.
     *
     * The sender's identity is NOT included in the notification.
     */
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

    if (otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map(
          (member) => ({
            userId: member.userId,
            householdId:
              membership.householdId,
            type: "FEEDBACK_ACTIVITY",
            title: "New Feedback",
            message:
              "A household member submitted anonymous feedback.",
            isRead: false,
          }),
        ),
      });
    }

    return NextResponse.json(
      {
        success: true,
        feedback,
        message:
          "Feedback submitted successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST_FEEDBACK_ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to submit feedback.",
      },
      { status: 500 },
    );
  }
}