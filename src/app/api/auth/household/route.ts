import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    const authUser = await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
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
        include: {
          household: {
            include: {
              members: {
                orderBy: {
                  joinedAt: "asc",
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!membership) {
      return NextResponse.json({
        success: true,
        hasHousehold: false,
        household: null,
      });
    }

    const household = membership.household;

    return NextResponse.json({
      success: true,
      hasHousehold: true,
      household: {
        id: household.id,
        name: household.name,
        invitationCode: household.invitationCode,
        myRole: membership.role,

        members: household.members.map((member) => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            imageUrl: member.user.imageUrl,
          },
        })),

        createdAt: household.createdAt,
        updatedAt: household.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "HOUSEHOLD_GET_ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load household information.",
      },
      { status: 500 },
    );
  }
}