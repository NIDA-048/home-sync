import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateTaskSchema = z.object({
  status: z.enum([
    "TO_DO",
    "IN_PROGRESS",
    "DONE",
  ]),
});

async function getAuthenticatedUser(request?: Request) {
  let token = "";

  if (request) {
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      token = authorization.substring(7);
    }
  }

  if (!token) {
    const cookieStore = await cookies();
    token =
      cookieStore.get("homesync-token")?.value ||
      cookieStore.get("token")?.value ||
      "";
  }

  if (!token) {
    return null;
  }

  const authUser = await verifyAuthToken(token);
  if (!authUser?.userId) {
    return null;
  }

  return authUser;
}

async function getHouseholdMembership(userId: string) {
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

/**
 * GET /api/tasks/[id]
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const membership = await getHouseholdMembership(authUser.userId);

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not part of any household.",
        },
        { status: 403 }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id,
        householdId: membership.householdId,
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        assignments: {
          orderBy: {
            rotationPosition: "asc",
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
        rotation: true,
        completions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            userId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            timeTakenMinutes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        evidence: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            userId: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            createdAt: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("GET_TASK_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load task.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task status.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const membership = await getHouseholdMembership(authUser.userId);

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not part of any household.",
        },
        { status: 403 }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id,
        householdId: membership.householdId,
        isActive: true,
      },
      include: {
        assignments: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        { status: 404 }
      );
    }

    const isAssigned = task.assignments.some(
      (assignment) => assignment.userId === authUser.userId
    );

    if (!isAssigned) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not assigned to this task.",
        },
        { status: 403 }
      );
    }

    const requestedStatus = parsed.data.status;

    /**
     * START TIMER (IN_PROGRESS)
     */
    if (requestedStatus === "IN_PROGRESS") {
      const existingCompletion = await prisma.taskCompletion.findUnique({
        where: {
          taskId_userId: {
            taskId: task.id,
            userId: authUser.userId,
          },
        },
      });

      let completion;

      if (
        existingCompletion?.status === "IN_PROGRESS" &&
        existingCompletion.startedAt
      ) {
        completion = existingCompletion;
      } else if (existingCompletion?.status === "COMPLETED") {
        return NextResponse.json(
          {
            success: false,
            message: "This task has already been completed.",
          },
          { status: 400 }
        );
      } else {
        completion = existingCompletion
          ? await prisma.taskCompletion.update({
              where: {
                id: existingCompletion.id,
              },
              data: {
                status: "IN_PROGRESS",
                startedAt: new Date(),
                completedAt: null,
                timeTakenMinutes: null,
              },
            })
          : await prisma.taskCompletion.create({
              data: {
                taskId: task.id,
                userId: authUser.userId,
                status: "IN_PROGRESS",
                startedAt: new Date(),
              },
            });
      }

      const updatedTask = await prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          status: "IN_PROGRESS",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
          assignments: {
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
          rotation: true,
          completions: true,
          evidence: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Task started. Timer is running.",
        task: updatedTask,
        completion,
        timerStartedAt: completion.startedAt,
      });
    }

    /**
     * DONE REQUIRES EVIDENCE UPLOAD
     */
    if (requestedStatus === "DONE") {
      const completion = await prisma.taskCompletion.findUnique({
        where: {
          taskId_userId: {
            taskId: task.id,
            userId: authUser.userId,
          },
        },
      });

      if (
        !completion ||
        completion.status !== "IN_PROGRESS" ||
        !completion.startedAt
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please start the task first. The completion timer must be running before submitting evidence.",
            requiresStart: true,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Please upload completion evidence before completing this task.",
          requiresEvidence: true,
          completion,
        },
        { status: 400 }
      );
    }

    /**
     * RESET TO TO_DO
     */
    if (requestedStatus === "TO_DO") {
      await prisma.$transaction(async (tx) => {
        const existingCompletion = await tx.taskCompletion.findUnique({
          where: {
            taskId_userId: {
              taskId: task.id,
              userId: authUser.userId,
            },
          },
        });

        if (existingCompletion) {
          await tx.taskCompletion.update({
            where: {
              id: existingCompletion.id,
            },
            data: {
              status: "PENDING",
              startedAt: null,
              completedAt: null,
              timeTakenMinutes: null,
            },
          });
        }

        await tx.task.update({
          where: {
            id: task.id,
          },
          data: {
            status: "TO_DO",
          },
        });
      });

      const updatedTask = await prisma.task.findUnique({
        where: {
          id: task.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
          assignments: {
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
          rotation: true,
          completions: true,
          evidence: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Task moved back to To Do.",
        task: updatedTask,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unsupported task status.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("UPDATE_TASK_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update task.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const membership = await getHouseholdMembership(authUser.userId);

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not part of any household.",
        },
        { status: 403 }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id,
        householdId: membership.householdId,
        isActive: true,
      },
      include: {
        assignments: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        { status: 404 }
      );
    }

    const isCreator = task.createdById === authUser.userId;

    if (!isCreator) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the member who created this task can delete it.",
        },
        { status: 403 }
      );
    }

    await prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE_TASK_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete task.",
      },
      { status: 500 }
    );
  }
}