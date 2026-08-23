import { NextRequest, NextResponse } from 'next/server';
import prisma, { withRetry } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized. STUDENT access required.' }, { status: 403 });
    }

    const rawParams = await context.params;
    const programId = rawParams?.id;
    
    // Resolve Student ID
    let studentId = session.user.profileId;
    if (!studentId) {
      const studentRecord = await withRetry(() => prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: session.user.userId },
            { user: { email: session.user.email?.toLowerCase().trim() || '' } }
          ]
        }
      }));
      studentId = studentRecord?.id || session.user.id;
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 });
    }

    const program = await withRetry(() => prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    }));

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.capacity && program._count.enrollments >= program.capacity) {
      return NextResponse.json({ error: 'Program is full' }, { status: 400 });
    }

    const enrollment = await withRetry(() => prisma.enrollment.upsert({
      where: {
        studentId_trainingProgramId: {
          studentId,
          trainingProgramId: programId,
        },
      },
      update: {},
      create: {
        studentId,
        trainingProgramId: programId,
      },
    }));

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error: any) {
    console.error('Error enrolling in training:', error);
    return NextResponse.json({ error: error.message || 'Failed to enroll in program' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized. STUDENT access required.' }, { status: 403 });
    }

    const rawParams = await context.params;
    const programId = rawParams?.id;
    
    let studentId = session.user.profileId;
    if (!studentId) {
      const studentRecord = await withRetry(() => prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: session.user.userId },
            { user: { email: session.user.email?.toLowerCase().trim() || '' } }
          ]
        }
      }));
      studentId = studentRecord?.id || session.user.id;
    }

    const enrollment = await withRetry(() => prisma.enrollment.findFirst({
      where: {
        trainingProgramId: programId,
        studentId,
      },
    }));

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment record not found' }, { status: 404 });
    }

    await withRetry(() => prisma.enrollment.delete({
      where: {
        id: enrollment.id,
      },
    }));

    return NextResponse.json({ success: true, message: 'Successfully unenrolled from program' });
  } catch (error: any) {
    console.error('Error unenrolling from training:', error);
    return NextResponse.json({ error: error.message || 'Failed to unenroll from program' }, { status: 500 });
  }
}
