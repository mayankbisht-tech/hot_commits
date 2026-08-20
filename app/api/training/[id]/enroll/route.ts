import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized. STUDENT access required.' }, { status: 403 });
    }

    const { id: programId } = await params;
    
    // Resolve Student ID
    let studentId = session.user.profileId;
    if (!studentId) {
      const studentRecord = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: session.user.userId }
          ]
        }
      });
      studentId = studentRecord?.id || session.user.id;
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 });
    }

    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.capacity && program._count.enrollments >= program.capacity) {
      return NextResponse.json({ error: 'Program is full' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.upsert({
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
    });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error: any) {
    console.error('Error enrolling in training:', error);
    return NextResponse.json({ error: error.message || 'Failed to enroll in program' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized. STUDENT access required.' }, { status: 403 });
    }

    const { id: programId } = await params;
    
    let studentId = session.user.profileId;
    if (!studentId) {
      const studentRecord = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: session.user.userId }
          ]
        }
      });
      studentId = studentRecord?.id || session.user.id;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        trainingProgramId: programId,
        OR: [
          { studentId },
          { studentId: session.user.id }
        ]
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    await prisma.enrollment.delete({
      where: {
        id: enrollment.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json({ error: error.message || 'Failed to un-enroll' }, { status: 500 });
  }
}
