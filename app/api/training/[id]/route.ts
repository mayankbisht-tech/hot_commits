import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const program = await prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: true,
          }
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, type, date, time, venue, mode, capacity, facilitator, description, tags } = body;

    const dataToUpdate: any = {
      title,
      type,
      time,
      venue,
      mode,
      capacity: capacity ? Number(capacity) : undefined,
      facilitator,
      description,
    };

    if (date) {
      dataToUpdate.date = new Date(date);
    }
    
    if (tags !== undefined) {
      dataToUpdate.tagsJson = JSON.stringify(tags);
    }

    const updatedProgram = await prisma.trainingProgram.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedProgram);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.trainingProgram.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
