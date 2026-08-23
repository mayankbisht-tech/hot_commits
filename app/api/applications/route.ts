import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const driveId = searchParams.get('driveId');
    const status = searchParams.get('status');

    let whereClause: any = {};

    if (session.user.role === 'STUDENT') {
      const studentRec = await prisma.student.findFirst({
        where: {
          OR: [
            { id: session.user.profileId || '' },
            { userId: session.user.userId || session.user.id || '' },
            { user: { email: session.user.email?.toLowerCase().trim() || '' } }
          ]
        }
      });
      const resolvedStudentId = studentRec?.id || session.user.profileId || session.user.id;
      whereClause.studentId = resolvedStudentId;
      if (driveId) whereClause.driveId = driveId;
      if (status) whereClause.status = status.toUpperCase();
    } else if (session.user.role === 'COMPANY') {
      const compId = session.user.profileId || session.user.id;
      whereClause.drive = { companyId: compId };
      if (studentId) whereClause.studentId = studentId;
      if (driveId) whereClause.driveId = driveId;
      if (status) whereClause.status = status.toUpperCase();
    } else if (session.user.role === 'TPO') {
      if (studentId) whereClause.studentId = studentId;
      if (driveId) whereClause.driveId = driveId;
      if (status) whereClause.status = status.toUpperCase();
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: {
          select: { name: true, rollNo: true, branch: true, cgpa: true, id: true, skillsJson: true }
        },
        drive: {
          select: { id: true, role: true, ctc: true, company: { select: { name: true } } }
        },
        stageHistory: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { appliedOn: 'desc' }
    });

    const formatted = applications.map(a => ({
      ...a,
      student: {
        ...a.student,
        skills: a.student?.skillsJson ? JSON.parse(a.student.skillsJson) : ['React', 'TypeScript', 'Node.js']
      }
    }));

    return NextResponse.json({ applications: formatted });
  } catch (error) {
    console.error('Error in GET /api/applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentProfileId = session.user.profileId || session.user.id;

    // Fetch student profile and drive rules
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: studentProfileId || '' },
          { userId: session.user.userId || session.user.id || '' },
          { user: { email: session.user.email?.toLowerCase().trim() || '' } }
        ]
      },
      include: { offers: true }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { driveId, coverNote } = body;

    if (!driveId) {
      return NextResponse.json({ error: 'Drive ID is required' }, { status: 400 });
    }

    // Check if already applied
    const existingApp = await prisma.application.findUnique({
      where: {
        studentId_driveId: { studentId: student.id, driveId }
      }
    });

    if (existingApp) {
      return NextResponse.json({ error: 'Already applied to this drive' }, { status: 400 });
    }

    const drive = await prisma.drive.findUnique({
      where: { id: driveId }
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Eligibility check
    if (student.cgpa < drive.minCGPA) {
      return NextResponse.json({ error: `Ineligible: CGPA criteria not met (Min: ${drive.minCGPA})` }, { status: 400 });
    }
    const eligibleBranches = drive.branchesJson ? JSON.parse(drive.branchesJson) : [];
    if (eligibleBranches.length > 0 && !eligibleBranches.includes(student.branch)) {
      return NextResponse.json({ error: 'Ineligible: Branch not eligible' }, { status: 400 });
    }

    // Enforce offer policy & 2X policy
    const acceptedOffers = student.offers.filter(o => o.status === 'ACCEPTED');
    const hasAcceptedOffer = student.placementStatus === 'PLACED' || acceptedOffers.length > 0;
    const initialOfferCTC = acceptedOffers.length > 0 ? Math.max(...acceptedOffers.map(o => o.ctc)) : 12;

    if (hasAcceptedOffer && drive.ctc < initialOfferCTC * 2) {
      return NextResponse.json({ 
        error: `Ineligible under 2X Placement Policy: You hold an initial offer of ₹${initialOfferCTC} LPA and can only apply to drives offering at least ₹${initialOfferCTC * 2} LPA.` 
      }, { status: 400 });
    }

    // Create Application
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        driveId,
        status: 'APPLIED',
        stageHistory: {
          create: {
            stage: 'Applied',
            note: coverNote || null
          }
        }
      },
      include: {
        stageHistory: true
      }
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
