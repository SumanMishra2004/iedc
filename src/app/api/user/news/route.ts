// app/api/admin/latest-news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Helper: Check if user is admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.userType === "ADMIN";
}

// Validation for PUT and DELETE
const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  HomePageVisibility: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.array(z.string().uuid()).min(1, "At least one ID is required"),
});

// GET: Fetch all news
export async function GET() {
  try {
    const news = await prisma.latestNews.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(news);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// POST: Create new news
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { message: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      title = "",
      content = "",
      tags = [""],
      HomePageVisibility = false,
    } = body;

    const news = await prisma.latestNews.create({
      data: { title, content, tags, homePageVisibility: HomePageVisibility },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { message: "Failed to create news" },
      { status: 400 }
    );
  }
}

// PUT: Update by ID from body
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { message: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }
  //TODO: Add pagination

  try {
    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    const updated = await prisma.latestNews.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { message: "Failed to update news" },
      { status: 500 }
    );
  }
}

// DELETE: Delete by ID from body
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { message: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validation = deleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    await prisma.latestNews.deleteMany({
      where: { id: { in: id } },
    });

    return NextResponse.json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to delete news" },
      { status: 500 }
    );
  }
}
