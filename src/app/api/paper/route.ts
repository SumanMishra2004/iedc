import { PrismaClient, $Enums, User } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      abstract,
      filePath,
      keywords,
      reviewer,
      facultyAdvisors,
      students,
    } = body;

    // Validation (basic example)
    if (
      !title ||
      !abstract ||
      !filePath ||
      !keywords?.length ||
      !reviewer?.email ||
      !reviewer?.name ||
      !facultyAdvisors?.length ||
      !students?.length
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Find reviewer user
    const reviewerUser = await prisma.user.findUnique({
      where: { email: reviewer.email },
    });
    if (!reviewerUser) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 400 });
    }

    // 2. Find faculty advisors users
    const advisorUsers = [];
    for (const adv of facultyAdvisors) {
      const advisor = await prisma.user.findUnique({ where: { email: adv.email } });
      if (!advisor) {
        return NextResponse.json({ error: `Advisor not found: ${adv.email}` }, { status: 400 });
      }
      advisorUsers.push(advisor);
    }

    // 3. Find student users
    const studentUsers: User[] = [];
    for (const student of students) {
      const stu = await prisma.user.findUnique({ where: { email: student.email } });
      if (!stu) {
        return NextResponse.json({ error: `Student not found: ${student.email}` }, { status: 400 });
      }
      studentUsers.push(stu);
    }

    // 4. Create ResearchPaper entry
    const paper = await prisma.researchPaper.create({
      data: {
        title,
        abstract,
        filePath,
        keywords,
        reviewerId: reviewerUser.id,
        authorsInfo: students.map((s: any) => ({
          name: s.name,
          email: s.email,
          contribution: s.contribution,
        })),
      },
    });

    // 5. Create PaperAuthorContribution records
    await prisma.paperAuthorContribution.createMany({
      data: students.map((s: any) => {
        const matchedUser = studentUsers.find(u => u.email === s.email);
        return {
          paperId: paper.id,
          userId: matchedUser!.id,
          contribution: s.contribution,
        };
      }),
    });

    // 6. Create PaperAdvisor records for each faculty advisor
    for (const advisor of advisorUsers) {
      await prisma.paperAdvisor.create({
        data: {
          paperId: paper.id,
          advisorId: advisor.id,
          acceptanceStatus: 'PENDING',
          assignedDate: new Date(),
        },
      });
    }

    return NextResponse.json({ message: 'Paper uploaded successfully', paperId: paper.id }, { status: 201 });
  } catch (error) {
    console.error('[UPLOAD_PAPER_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
