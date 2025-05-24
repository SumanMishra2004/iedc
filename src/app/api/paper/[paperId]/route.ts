import { NextResponse } from "next/server";
import { PrismaClient, PaperStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { paperId } =await params;

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

    // Format contributors to only return user details + contribution
    const formattedContributors = paper.contributors.map((contributor) => ({
      id: contributor.id,
      contribution: contributor.contribution,
      user: contributor.user, // has id, name, email only
    }));

    // Format faculty advisors to flatten advisor details
    const formattedFacultyAdvisors = paper.facultyAdvisors.map((fa) => ({
      id: fa.id,
      acceptanceStatus: fa.acceptanceStatus,
      assignedDate: fa.assignedDate,
      decisionDate: fa.decisionDate,
      advisor: fa.advisor, // has id, name, email only
    }));

    // Build final response with filtered fields
    const response = {
      ...paper,
      contributors: formattedContributors,
      facultyAdvisors: formattedFacultyAdvisors,
      reviewer: paper.reviewer, // already filtered
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { paperId } = await params; // no await needed here
    const body = await request.json();

    // Only allow these fields to be updated
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

    // Validate status if provided
    if (
      dataToUpdate.status &&
      !Object.values(PaperStatus).includes(dataToUpdate.status)
    ) {
      return NextResponse.json(
        { error: "Invalid paper status" },
        { status: 400 }
      );
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

    // Format contributors to flatten user fields + contribution
    const formattedContributors = updatedPaper.contributors.map((contributor) => ({
      id: contributor.id,
      contribution: contributor.contribution,
      user: contributor.user, // only id, name, email here
    }));

    // Construct final response object with formatted contributors & reviewer
    const response = {
      ...updatedPaper,
      contributors: formattedContributors,
      reviewer: updatedPaper.reviewer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update paper:", error);
    return NextResponse.json(
      { error: "Failed to update paper" },
      { status: 500 }
    );
  }
}

// DELETE /paper/:paperId - delete a paper
export async function DELETE(
  request: Request,
  { params }: { params: { paperId: string } }
) {
  try {
    const { paperId } = await params;

    // Delete dependent author contributions first
    await prisma.paperAuthorContribution.deleteMany({
      where: { paperId },
    });

    // Now delete the research paper itself
    await prisma.researchPaper.delete({
      where: { id: paperId },
    });
   

    return NextResponse.json({ message: "Paper deleted successfully" });
  } catch (error) {
    console.error("Failed to delete paper:", error);
    return NextResponse.json(
      { error: "Failed to delete paper" },
      { status: 500 }
    );
  }
}
