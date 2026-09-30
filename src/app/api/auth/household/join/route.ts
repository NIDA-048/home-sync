import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

const joinHouseholdSchema = z.object({
  invitationCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(5, "Please enter a valid invitation code.")
    .max(30, "Invitation code is too long."),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const authUser = await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result =
      joinHouseholdSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ??
            "Invalid invitation code.",
        },
        { status: 400 }
      );
    }

    const { invitationCode } = result.data;

    const existingMembership =
      await prisma.householdMember.findFirst({
        where: {
          userId: authUser.userId,
        },
        select: {
          id: true,
        },
      });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are already a member of a household.",
        },
        { status: 409 }
      );
    }

    const household =
      await prisma.household.findUnique({
        where: {
          invitationCode,
        },
        select: {
          id: true,
          name: true,
          invitationCode: true,
        },
      });

    if (!household) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation code.",
        },
        { status: 404 }
      );
    }

    await prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: authUser.userId,
        role: "MEMBER",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "You joined the household successfully.",
        household: {
          id: household.id,
          name: household.name,
          invitationCode:
            household.invitationCode,
          role: "MEMBER",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "JOIN_HOUSEHOLD_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while joining the household.",
      },
      { status: 500 }
    );
  }
}