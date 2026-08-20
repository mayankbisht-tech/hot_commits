import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');

    let whereClause: any = {};
    if (status) whereClause.status = status.toUpperCase();

    // Company role MUST strictly see only its own drives
    if (user.role === 'COMPANY') {
      whereClause.companyId = user.profileId;
    } else if (companyId) {
      whereClause.companyId = companyId;
    }

    if (search) {
      whereClause.OR = [
        { role: { contains: search } },
      ];
    }

    const drives = await prisma.drive.findMany({
      where: whereClause,
      include: {
        company: {
          select: { name: true, tier: true, logo: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedDrives = drives.map(drive => ({
      ...drive,
      status: drive.status.toLowerCase(),
      approvalStatus: drive.approvalStatus.toLowerCase(),
      branches: drive.branchesJson ? JSON.parse(drive.branchesJson) : [],
      rounds: drive.roundsJson ? JSON.parse(drive.roundsJson) : [],
      gradYears: drive.gradYearsJson ? JSON.parse(drive.gradYearsJson) : [],
    }));

    return NextResponse.json({ drives: parsedDrives });
  } catch (error) {
    console.error('Fetch drives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'TPO' && user.role !== 'COMPANY')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    let compId = body.companyId;

    if (user.role === 'COMPANY') {
      compId = user.profileId;
    }

    if (!compId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const approvalStatus = user.role === 'COMPANY' ? 'PENDING' : 'APPROVED';
    const status = user.role === 'COMPANY' ? 'UPCOMING' : 'ACTIVE';
    const deadlineDate = body.deadline ? new Date(body.deadline) : new Date();
    const driveDate = body.driveDate ? new Date(body.driveDate) : deadlineDate;

    const drive = await prisma.drive.create({
      data: {
        role: body.role,
        ctc: Number(body.ctc) || 0,
        location: body.location || 'New Delhi',
        mode: body.mode || 'ONSITE',
        deadline: deadlineDate,
        driveDate: driveDate,
        jobType: body.jobType || 'FULL_TIME',
        description: body.description || '',
        status: status,
        approvalStatus: approvalStatus,
        minCGPA: Number(body.minCGPA) || 6.0,
        maxBacklogs: Number(body.maxBacklogs) || 0,
        minClass10: Number(body.minClass10) || 60,
        minClass12: Number(body.minClass12) || 60,
        offerPolicy: body.offerPolicy || 'STANDARD',
        companyId: compId,
        branchesJson: body.branches ? JSON.stringify(body.branches) : '[]',
        roundsJson: body.rounds ? JSON.stringify(body.rounds) : '[]',
        gradYearsJson: body.gradYears ? JSON.stringify(body.gradYears) : '[]',
      },
      include: {
        company: { select: { name: true, tier: true } }
      }
    });

    return NextResponse.json({ drive });
  } catch (error) {
    console.error('Create drive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
