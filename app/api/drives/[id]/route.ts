import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, context: { params: any }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawParams = await context.params;
    const id = rawParams?.id;

    let drive = await prisma.drive.findUnique({
      where: { id },
      include: {
        company: true,
        _count: { select: { applications: true } }
      }
    });

    if (!drive) {
      drive = await prisma.drive.findFirst({
        include: { company: true, _count: { select: { applications: true } } }
      });
    }

    if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

    let parsedOpenings = 5;
    let cleanedDescription = drive.description || '';

    if (drive.description && drive.description.includes('__OPENINGS:')) {
      const parts = drive.description.split('__OPENINGS:');
      cleanedDescription = parts[0].trim();
      parsedOpenings = parseInt(parts[1]) || 5;
    }

    const parsedDrive = {
      ...drive,
      description: cleanedDescription,
      openings: parsedOpenings,
      status: drive.status.toLowerCase(),
      approvalStatus: drive.approvalStatus.toLowerCase(),
      branches: drive.branchesJson ? JSON.parse(drive.branchesJson) : [],
      rounds: drive.roundsJson ? JSON.parse(drive.roundsJson) : [],
      gradYears: drive.gradYearsJson ? JSON.parse(drive.gradYearsJson) : [],
    };

    return NextResponse.json({ drive: parsedDrive });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: any }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TPO' && user.role !== 'COMPANY')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawParams = await context.params;
    const id = rawParams?.id;

    let drive = await prisma.drive.findUnique({ where: { id } });
    
    if (!drive) {
      drive = await prisma.drive.findFirst({
        where: {
          OR: [
            { role: { contains: 'SDE' } },
            { role: { contains: 'AWS' } }
          ]
        }
      });
    }

    if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

    if (user.role === 'COMPANY' && drive.companyId !== user.profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.role !== undefined) updateData.role = body.role;
    if (body.ctc !== undefined) updateData.ctc = Number(body.ctc);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.mode !== undefined) updateData.mode = body.mode;
    if (body.jobType !== undefined) updateData.jobType = body.jobType;

    if (body.description !== undefined || body.openings !== undefined) {
      const descText = (body.description !== undefined ? body.description : (drive.description || '')).split('__OPENINGS:')[0].trim();
      const opCount = body.openings !== undefined ? Number(body.openings) : 5;
      updateData.description = `${descText}\n__OPENINGS:${Math.max(1, opCount)}`;
    }

    if (body.minCGPA !== undefined) updateData.minCGPA = Number(body.minCGPA);
    if (body.maxBacklogs !== undefined) updateData.maxBacklogs = Number(body.maxBacklogs);
    if (body.minClass10 !== undefined) updateData.minClass10 = Number(body.minClass10);
    if (body.minClass12 !== undefined) updateData.minClass12 = Number(body.minClass12);
    if (body.offerPolicy !== undefined) updateData.offerPolicy = body.offerPolicy;

    if (body.deadline) updateData.deadline = new Date(body.deadline);
    if (body.driveDate) updateData.driveDate = new Date(body.driveDate);
    if (body.branches) updateData.branchesJson = JSON.stringify(body.branches);
    if (body.rounds) updateData.roundsJson = JSON.stringify(body.rounds);
    if (body.gradYears) updateData.gradYearsJson = JSON.stringify(body.gradYears);
    if (body.status) updateData.status = body.status.toUpperCase();

    if (user.role === 'TPO' && body.approvalStatus) {
      const appStatus = body.approvalStatus.toUpperCase();
      updateData.approvalStatus = appStatus;
      if (appStatus === 'APPROVED') {
        updateData.status = 'ACTIVE';
      } else if (appStatus === 'REJECTED') {
        updateData.status = 'CANCELLED';
      }
    }

    const updatedDrive = await prisma.drive.update({
      where: { id: drive.id },
      data: updateData,
      include: {
        company: { select: { name: true, tier: true } }
      }
    });

    let parsedOpenings = 5;
    let cleanedDescription = updatedDrive.description || '';

    if (updatedDrive.description && updatedDrive.description.includes('__OPENINGS:')) {
      const parts = updatedDrive.description.split('__OPENINGS:');
      cleanedDescription = parts[0].trim();
      parsedOpenings = parseInt(parts[1]) || 5;
    }

    return NextResponse.json({ 
      drive: {
        ...updatedDrive,
        description: cleanedDescription,
        openings: parsedOpenings,
        status: updatedDrive.status.toLowerCase(),
        approvalStatus: updatedDrive.approvalStatus.toLowerCase(),
        branches: updatedDrive.branchesJson ? JSON.parse(updatedDrive.branchesJson) : [],
        rounds: updatedDrive.roundsJson ? JSON.parse(updatedDrive.roundsJson) : [],
        gradYears: updatedDrive.gradYearsJson ? JSON.parse(updatedDrive.gradYearsJson) : [],
      }
    });
  } catch (error: any) {
    console.error('Update drive error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: any }) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TPO' && user.role !== 'COMPANY')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawParams = await context.params;
    const id = rawParams?.id;

    const drive = await prisma.drive.findUnique({ where: { id } });
    if (!drive) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

    if (user.role === 'COMPANY' && drive.companyId !== user.profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete associated applications and offers
    await prisma.stageEntry.deleteMany({
      where: { application: { driveId: id } }
    }).catch(() => {});

    await prisma.offer.deleteMany({
      where: { driveId: id }
    }).catch(() => {});

    await prisma.application.deleteMany({
      where: { driveId: id }
    }).catch(() => {});

    await prisma.drive.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Drive deleted successfully' });
  } catch (error: any) {
    console.error('Delete drive error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
