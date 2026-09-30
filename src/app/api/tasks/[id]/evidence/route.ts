import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AIResult = {
  verified: boolean;
  reason: string;
};

function getSafeExtension(fileName: string, mimeType: string) {
  const extension = path.extname(fileName).toLowerCase();

  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  if (allowedExtensions.includes(extension)) {
    return extension;
  }

  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";

  return ".jpg";
}

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

  try {
    const payload = await verifyAuthToken(token);

    if (!payload?.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

async function getUserHousehold(userId: string) {
  const membership = await prisma.householdMember.findFirst({
    where: {
      userId,
    },
    select: {
      householdId: true,
    },
  });

  return membership;
}

function calculateTimeTakenMinutes(startedAt: Date, completedAt: Date) {
  const milliseconds = completedAt.getTime() - startedAt.getTime();

  return Math.max(0, Math.ceil(milliseconds / 60000));
}

async function verifyTaskImage(
  taskTitle: string,
  taskDescription: string | null,
  imageDataUrl: string
): Promise<AIResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      verified: true,
      reason: "Completion photo uploaded successfully.",
    };
  }

  const taskDetails = [
    `Task: ${taskTitle}`,
    taskDescription ? `Description: ${taskDescription}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are verifying photo evidence for a household task.\n\n${taskDetails}\n\nLook carefully at the provided image and decide whether it reasonably shows that the household task has been completed.\nReturn ONLY valid JSON in this exact format:\n{"verified": true, "reason": "Short explanation"} or {"verified": false, "reason": "Short explanation"}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        verified: true,
        reason: "Photo uploaded successfully (AI service bypassed).",
      };
    }

    const result = await response.json();
    const outputText = result?.choices?.[0]?.message?.content || "";

    if (!outputText) {
      return {
        verified: true,
        reason: "Photo uploaded successfully.",
      };
    }

    const cleaned = outputText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      verified: Boolean(parsed.verified),
      reason:
        typeof parsed.reason === "string"
          ? parsed.reason
          : "Photo evidence verified.",
    };
  } catch {
    return {
      verified: true,
      reason: "Completion photo uploaded successfully.",
    };
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const { id: taskId } = await context.params;

    const household = await getUserHousehold(user.id);

    if (!household) {
      return NextResponse.json(
        {
          message: "You are not a member of any household.",
        },
        {
          status: 403,
        }
      );
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        householdId: household.householdId,
        isActive: true,
      },
      include: {
        assignments: {
          where: {
            userId: user.id,
          },
        },
        completions: {
          where: {
            userId: user.id,
          },
          orderBy: {
            startedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          message: "Task not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (task.assignments.length === 0) {
      return NextResponse.json(
        {
          message: "You are not assigned to this task.",
        },
        {
          status: 403,
        }
      );
    }

    const completion = task.completions[0];

    if (!completion || completion.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          message: "Start the task before submitting completion evidence.",
        },
        {
          status: 400,
        }
      );
    }

    if (!completion.startedAt) {
      return NextResponse.json(
        {
          message: "Task timer was not started correctly.",
        },
        {
          status: 400,
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "Please upload a completion photo.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message: "Only JPG, PNG, and WEBP images are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    const maxFileSize = 8 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          message: "Image size must be less than 8 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;

    const verification = await verifyTaskImage(
      task.title,
      task.description,
      imageDataUrl
    );

    if (!verification.verified) {
      return NextResponse.json(
        {
          verified: false,
          completed: false,
          message: "The photo could not be verified.",
          reason: verification.reason,
        },
        {
          status: 200,
        }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "task-evidence"
    );

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    const extension = getSafeExtension(file.name, file.type);
    const uniqueFileName = `${task.id}-${user.id}-${Date.now()}-${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDirectory, uniqueFileName);

    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/task-evidence/${uniqueFileName}`;

    const completedAt = new Date();
    const timeTakenMinutes = calculateTimeTakenMinutes(
      completion.startedAt,
      completedAt
    );

    const result = await prisma.$transaction(async (tx) => {
      const evidence = await tx.taskEvidence.create({
        data: {
          taskId: task.id,
          userId: user.id,
          fileUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        },
      });

      const updatedCompletion = await tx.taskCompletion.update({
        where: {
          id: completion.id,
        },
        data: {
          status: "COMPLETED",
          completedAt,
          timeTakenMinutes,
        },
      });

      const updatedTask = await tx.task.update({
        where: {
          id: task.id,
        },
        data: {
          status: "DONE",
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
          completions: true,
          evidence: true,
        },
      });

      return {
        evidence,
        completion: updatedCompletion,
        task: updatedTask,
      };
    });

    // Create TASK_COMPLETED notification for household members (excluding the completer)
    try {
      const householdMembers = await prisma.householdMember.findMany({
        where: { householdId: household.householdId, userId: { not: user.id } },
        select: { userId: true },
      });

      if (householdMembers.length > 0) {
        await prisma.notification.createMany({
          data: householdMembers.map((member) => ({
            userId: member.userId,
            householdId: household.householdId,
            type: "TASK_COMPLETED" as const,
            title: "Task Completed",
            message: `${user.name} completed "${task.title}".`,
            isRead: false,
            relatedTaskId: task.id,
          })),
        });
      }
    } catch (notifError) {
      // Non-fatal — task is already completed, log and continue
      console.error("TASK_COMPLETED_NOTIFICATION_ERROR:", notifError);
    }

    return NextResponse.json(
      {
        verified: true,
        completed: true,
        message: "Task completed successfully.",
        reason: verification.reason,
        timeTakenMinutes,
        evidence: result.evidence,
        completion: result.completion,
        task: result.task,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Task evidence error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while verifying the task evidence.",
      },
      {
        status: 500,
      }
    );
  }
}