import { NextResponse } from "next/server";
import { PrismaClient, PaperStatus } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/paper/[paperId]
export async function GET(
  request: Request,
  context: { params: { paperId: string } }
) {
  try {
    const { paperId } = context.params;

    const paper = await prisma.researchPaper.findUnique({
      where: { id: paperId },
      include: {
        contributors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        facultyAdvisors: {
          include: {
            advisor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reviews: true,
        notifications: true,
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const formattedContributors = paper.contributors.map((contributor) => ({
      id: contributor.id,
      contribution: contributor.contribution,
      user: contributor.user,
    }));

    const formattedFacultyAdvisors = paper.facultyAdvisors.map((fa) => ({
      id: fa.id,
      acceptanceStatus: fa.acceptanceStatus,
      assignedDate: fa.assignedDate,
      decisionDate: fa.decisionDate,
      advisor: fa.advisor,
    }));

    const response = {
      ...paper,
      contributors: formattedContributors,
      facultyAdvisors: formattedFacultyAdvisors,
      reviewer: paper.reviewer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch paper:", error);
    return NextResponse.json({ error: "Failed to fetch paper" }, { status: 500 });
  }
}

// PATCH /api/paper/[paperId]
export async function PATCH(
  request: Request,
  context: { params: { paperId: string } }
) {
  try {
    const { paperId } = context.params;
    const body = await request.json();

    const allowedUpdates = [
      "title",
      "abstract",
      "filePath",
      "status",
      "keywords",
      "rejectionRemark",
      "reviewerId",
    ];

    const dataToUpdate: Record<string, any> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        dataToUpdate[key] = body[key];
      }
    }

    if (
      dataToUpdate.status &&
      !Object.values(PaperStatus).includes(dataToUpdate.status)
    ) {
      return NextResponse.json({ error: "Invalid paper status" }, { status: 400 });
    }

    const updatedPaper = await prisma.researchPaper.update({
      where: { id: paperId },
      data: dataToUpdate,
      include: {
        contributors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedContributors = updatedPaper.contributors.map((contributor) => ({
      id: contributor.id,
      contribution: contributor.contribution,
      user: contributor.user,
    }));

    const response = {
      ...updatedPaper,
      contributors: formattedContributors,
      reviewer: updatedPaper.reviewer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update paper:", error);
    return NextResponse.json({ error: "Failed to update paper" }, { status: 500 });
  }
}

// DELETE /api/paper/[paperId]
export async function DELETE(
  request: Request,
  context: { params: { paperId: string } }
) {
  try {
    const { paperId } = context.params;

    await prisma.paperAuthorContribution.deleteMany({
      where: { paperId },
    });

    await prisma.researchPaper.delete({
      where: { id: paperId },
    });

    return NextResponse.json({ message: "Paper deleted successfully" });
  } catch (error) {
    console.error("Failed to delete paper:", error);
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
