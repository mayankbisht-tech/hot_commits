import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: user.profileId || '' },
          { userId: user.userId || '' },
          { userId: user.id || '' },
          { user: { email: user.email?.toLowerCase().trim() || '' } }
        ]
      },
      include: { offers: true }
    });

    if (!student && user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase().trim() },
        include: { student: { include: { offers: true } } }
      });
      if (dbUser?.student) {
        student = dbUser.student;
      }
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const drives = await prisma.drive.findMany({
      where: {
        status: { in: ['ACTIVE', 'UPCOMING'] },
      },
      include: {
        company: true
      },
      orderBy: { driveDate: 'asc' }
    });

    // Determine initial accepted offer package
    const acceptedOffers = student.offers.filter(o => o.status === 'ACCEPTED');
    const hasAcceptedOffer = acceptedOffers.length > 0 || student.placementStatus === 'PLACED';
    const initialOfferCTC = acceptedOffers.length > 0
      ? Math.max(...acceptedOffers.map(o => o.ctc))
      : (student.placementStatus === 'PLACED' ? 12 : 0);

    const dreamEligible = student.dreamEligible || student.cgpa >= 8.5;

    const eligibleDrives = drives.map(drive => {
      const reasons: string[] = [];
      let eligible = true;

      // 1. TPO Admin Approval requirement
      if (drive.approvalStatus !== 'APPROVED') {
        eligible = false;
        reasons.push('Pending TPO Admin Approval: This placement drive is awaiting administrative verification.');
      }

      const branches = drive.branchesJson ? JSON.parse(drive.branchesJson) : [];
      const gradYears = drive.gradYearsJson ? JSON.parse(drive.gradYearsJson) : [];

      let parsedOpenings = 5;
      let cleanedDescription = drive.description || '';

      if (drive.description && drive.description.includes('__OPENINGS:')) {
        const parts = drive.description.split('__OPENINGS:');
        cleanedDescription = parts[0].trim();
        parsedOpenings = parseInt(parts[1]) || 5;
      }

      if (branches.length > 0 && !branches.includes(student.branch)) {
        eligible = false;
        reasons.push(`Branch ${student.branch} not eligible (Required: ${branches.join(', ')})`);
      }

      if (gradYears.length > 0 && !gradYears.includes(student.graduationYear)) {
        eligible = false;
        reasons.push(`Graduation year ${student.graduationYear} not eligible`);
      }

      if (drive.minCGPA && student.cgpa < drive.minCGPA) {
        eligible = false;
        reasons.push(`CGPA (${student.cgpa}) below required minimum (${drive.minCGPA})`);
      }

      if (drive.maxBacklogs !== null && student.backlogs > drive.maxBacklogs) {
        eligible = false;
        reasons.push(`Active backlogs (${student.backlogs}) exceeds limit (${drive.maxBacklogs})`);
      }
      
      if (drive.minClass10 && student.class10 < drive.minClass10) {
        eligible = false;
        reasons.push(`Class 10th score (${student.class10}%) below minimum (${drive.minClass10}%)`);
      }

      if (drive.minClass12 && student.class12 < drive.minClass12) {
        eligible = false;
        reasons.push(`Class 12th score (${student.class12}%) below minimum (${drive.minClass12}%)`);
      }

      // 2X Initial Offer Rule
      if (hasAcceptedOffer && initialOfferCTC > 0) {
        const doublePackageThreshold = initialOfferCTC * 2;
        if (drive.ctc < doublePackageThreshold) {
          eligible = false;
          reasons.push(
            `2X Placement Policy Active: You hold an initial offer of ₹${initialOfferCTC} LPA. You can only participate in drives offering at least ₹${doublePackageThreshold} LPA (2X initial package).`
          );
        }
      }

      if (drive.offerPolicy === 'DREAM_OFFER' && !dreamEligible) {
        eligible = false;
        reasons.push('Dream offer: Minimum 8.5 CGPA required');
      }

      return {
        id: drive.id,
        role: drive.role,
        ctc: drive.ctc,
        location: drive.location,
        mode: drive.mode,
        deadline: drive.deadline,
        driveDate: drive.driveDate,
        status: drive.status,
        approvalStatus: drive.approvalStatus,
        jobType: drive.jobType,
        description: cleanedDescription,
        openings: parsedOpenings,
        company: {
          name: drive.company.name,
          tier: drive.company.tier
        },
        eligible,
        reasons,
        offerPolicy: drive.offerPolicy
      };
    });

    return NextResponse.json({ 
      drives: eligibleDrives,
      studentOfferInfo: {
        hasAcceptedOffer,
        initialOfferCTC,
        doublePackageThreshold: initialOfferCTC * 2,
        isEligibleForFurtherPlacements: !hasAcceptedOffer || initialOfferCTC > 0
      }
    });
  } catch (error) {
    console.error('Error fetching eligible drives:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
