import { NextRequest, NextResponse } from 'next/server';
import prisma, { withRetry } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    
    // Resolve student record ID
    let studentId = user.profileId;
    if (!studentId && user.role === 'STUDENT') {
      const studentRec = await withRetry(() => prisma.student.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { userId: user.userId || '' },
            { user: { email: user.email?.toLowerCase().trim() || '' } }
          ]
        }
      }));
      studentId = studentRec?.id || user.id;
    }

    const programs = await withRetry(() => prisma.trainingProgram.findMany({
      include: {
        _count: {
          select: { enrollments: true },
        },
        enrollments: {
          select: { studentId: true }
        }
      },
      orderBy: {
        date: 'asc',
      },
    }));

    const parsedPrograms = programs.map((program) => {
      let tags = [];
      try {
        if (program.tagsJson) {
          tags = JSON.parse(program.tagsJson);
        }
      } catch (e) {
        console.error('Error parsing tagsJson', e);
      }

      const totalEnrollments = program._count?.enrollments || 0;
      const isEnrolled = program.enrollments?.some(e => e.studentId === studentId || e.studentId === user.id);

      return {
        ...program,
        tags,
        _count: { enrollments: totalEnrollments },
        enrollmentCount: totalEnrollments,
        registeredCount: totalEnrollments,
        enrolledByMe: !!isEnrolled,
      };
    });

    return NextResponse.json({ programs: parsedPrograms });
  } catch (error: any) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json({ error: 'Failed to fetch training programs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, type, date, time, venue, mode, capacity, facilitator, description, tags = [] } = body;

    const program = await withRetry(() => prisma.trainingProgram.create({
      data: {
        title,
        type,
        date: new Date(date),
        time,
        venue,
        mode,
        capacity: Number(capacity),
        facilitator,
        description,
        tagsJson: JSON.stringify(tags),
      },
    }));

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    console.error('Error creating training program:', error);
    return NextResponse.json({ error: 'Failed to create training program' }, { status: 500 });
  }
}
