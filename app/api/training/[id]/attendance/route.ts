import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO access required.' }, { status: 403 });
    }

    const { id: programId } = await params;
    const body = await req.json();
    const { attendances } = body;

    if (!Array.isArray(attendances)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Use transaction for multiple updates
    await prisma.$transaction(
      attendances.map((record: any) => 
        prisma.enrollment.update({
          where: {
            studentId_trainingProgramId: {
              studentId: record.studentId,
              trainingProgramId: programId,
            }
          },
          data: {
            attended: record.attended,
          }
        })
      )
    );

    return NextResponse.json({ updated: attendances.length });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
