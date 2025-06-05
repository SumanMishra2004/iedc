import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      abstract,
      filePath,
      keywords,
      authorNames,
      reviewerName,
      facultyAdvisors,
    } = body;

    // Basic validation
    if (
      !title ||
      !abstract ||
      !filePath ||
      !Array.isArray(keywords) ||
      !Array.isArray(authorNames) ||
      !reviewerName ||
      !Array.isArray(facultyAdvisors)
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // Find reviewer by name (from User table)
    const reviewer = await prisma.user.findUnique({
      where: { name: reviewerName },
    });

    if (!reviewer) {
      return NextResponse.json(
        { message: `Reviewer ${reviewerName} not found.` },
        { status: 404 }
      );
    }

    // Find all faculty advisors by name (from User table)
    const advisorUsers = [];
    for (const advisorName of facultyAdvisors) {
      const advisor = await prisma.user.findUnique({
        where: { name: advisorName },
      });

      if (!advisor) {
        return NextResponse.json(
          { message: `Advisor ${advisorName} not found.` },
          { status: 404 }
        );
      }

      advisorUsers.push(advisor);
    }

    // Create the research paper
    const paper = await prisma.researchPaper.create({
      data: {
        title,
        abstract,
        filePath,
        keywords: { set: keywords },
        authorNames: { set: authorNames },
        reviewerName: reviewer.name,
        facultyAdvisors: { set: facultyAdvisors },
      },
    });

    // Create PaperAdvisor entries (linking to User.id as advisorId)
    for (const advisor of advisorUsers) {
      await prisma.paperAdvisor.create({
        data: {
          paperId: paper.id,
          advisorId: advisor.id,
          acceptanceStatus: "PENDING",
        },
      });
    }

    return NextResponse.json({ paper }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating paper:", error);

    if (process.env.NODE_ENV === "development") {
      console.error("Stack trace:", error.stack);
    }

    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
