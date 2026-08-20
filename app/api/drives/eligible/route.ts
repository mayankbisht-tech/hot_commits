import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id: user.profileId },
      include: { offers: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const drives = await prisma.drive.findMany({
      where: {
        status: { in: ['ACTIVE', 'UPCOMING'] },
        approvalStatus: 'APPROVED'
      },
      include: {
        company: true
      }
    });

    const hasAcceptedOffer = student.offers.some(o => o.status === 'ACCEPTED');
    const dreamEligible = student.dreamEligible;

    const eligibleDrives = drives.map(drive => {
      const reasons: string[] = [];
      let eligible = true;

      const branches = drive.branchesJson ? JSON.parse(drive.branchesJson) : [];
      const gradYears = drive.gradYearsJson ? JSON.parse(drive.gradYearsJson) : [];

      if (branches.length > 0 && !branches.includes(student.branch)) {
        eligible = false;
        reasons.push(`Branch ${student.branch} not eligible`);
      }

      if (gradYears.length > 0 && !gradYears.includes(student.graduationYear)) {
        eligible = false;
        reasons.push('Graduation year not eligible');
      }

      if (drive.minCGPA && student.cgpa < drive.minCGPA) {
        eligible = false;
        reasons.push(`Min CGPA required: ${drive.minCGPA}`);
      }

      if (drive.maxBacklogs !== null && student.backlogs > drive.maxBacklogs) {
        eligible = false;
        reasons.push(`Max backlogs allowed: ${drive.maxBacklogs}`);
      }
      
      if (drive.minClass10 && student.class10 < drive.minClass10) {
        eligible = false;
        reasons.push(`Min Class 10 percentage: ${drive.minClass10}%`);
      }

      if (drive.minClass12 && student.class12 < drive.minClass12) {
        eligible = false;
        reasons.push(`Min Class 12 percentage: ${drive.minClass12}%`);
      }

      if (drive.offerPolicy === 'ONE_OFFER' && hasAcceptedOffer) {
        eligible = false;
        reasons.push('One-Offer policy: You have already accepted an offer');
      } else if (drive.offerPolicy === 'DREAM_OFFER' && !dreamEligible) {
        eligible = false;
        reasons.push('Dream offer criteria not met (requires CGPA >= 8.5 & verified profile)');
      }

      return {
        ...drive,
        status: drive.status.toLowerCase(),
        approvalStatus: drive.approvalStatus.toLowerCase(),
        branches,
        rounds: drive.roundsJson ? JSON.parse(drive.roundsJson) : [],
        gradYears,
        eligible,
        reasons
      };
    });

    return NextResponse.json({ drives: eligibleDrives });
  } catch (error) {
    console.error('Fetch eligible drives error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
