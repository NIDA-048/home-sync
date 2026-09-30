import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

const createHouseholdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Household name must be at least 2 characters long.")
    .max(100, "Household name is too long."),
});

function generateInvitationCode() {
  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `HS-${randomPart}`;
}

async function createUniqueInvitationCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInvitationCode();

    const existingHousehold =
      await prisma.household.findUnique({
        where: {
          invitationCode: code,
        },
        select: {
          id: true,
        },
      });

    if (!existingHousehold) {
      return code;
    }
  }

  throw new Error(
    "Unable to generate a unique invitation code."
  );
}

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
      createHouseholdSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ??
            "Invalid household information.",
        },
        { status: 400 }
      );
    }

    const { name } = result.data;

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

    const invitationCode =
      await createUniqueInvitationCode();

    const household = await prisma.$transaction(
      async (transaction) => {
        const createdHousehold =
          await transaction.household.create({
            data: {
              name,
              invitationCode,
            },
          });

        await transaction.householdMember.create({
          data: {
            householdId: createdHousehold.id,
            userId: authUser.userId,
            role: "OWNER",
          },
        });

        return createdHousehold;
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Household created successfully.",
        household: {
          id: household.id,
          name: household.name,
          invitationCode:
            household.invitationCode,
          role: "OWNER",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE_HOUSEHOLD_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating the household.",
      },
      { status: 500 }
    );
  }
}