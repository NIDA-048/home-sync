import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { z } from "zod";

const profileSchema = z.object({
  imageUrl: z
    .string()
    .nullable()
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("homesync-token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const authUser =
      await verifyAuthToken(token);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result =
      profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid profile data.",
        },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.update({
        where: {
          id: authUser.userId,
        },
        data: {
          imageUrl:
            result.data.imageUrl ?? null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Profile picture updated successfully.",
      user,
    });
  } catch (error) {
    console.error(
      "PROFILE_UPDATE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update profile picture.",
      },
      { status: 500 }
    );
  }
}