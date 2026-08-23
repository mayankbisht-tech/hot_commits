import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, context: { params: any }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawParams = await context.params;
    const id = rawParams?.id;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: { select: { name: true, rollNo: true, branch: true, cgpa: true, id: true } },
        drive: { select: { id: true, role: true, ctc: true, companyId: true, company: { select: { name: true } } } },
        stageHistory: { orderBy: { date: 'asc' } }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: any }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawParams = await context.params;
    const id = rawParams?.id;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { drive: true }
    });

    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const { status, note, interviewDate, offerCtc } = await req.json();

    const readableStage = 
      status === 'APPLIED' ? 'Applied' :
      status === 'SHORTLISTED' ? 'Shortlisted' :
      status === 'INTERVIEW_SCHEDULED' ? 'Interview Scheduled' :
      status === 'OFFER_EXTENDED' ? 'Offer Extended' :
      status === 'OFFER_ACCEPTED' ? 'Offer Accepted' :
      status === 'REJECTED' ? 'Rejected' :
      status === 'WITHDRAWN' ? 'Offer Declined' : status;

    // 1. Update application status
    const updatedApp = await prisma.application.update({
      where: { id },
      data: { status },
      include: { drive: true }
    });

    // 2. Append stage history entry
    await prisma.stageEntry.create({
      data: {
        applicationId: id,
        stage: readableStage,
        note: note || (status === 'REJECTED' ? 'Application not moving forward' : null),
        date: interviewDate ? new Date(interviewDate) : new Date()
      }
    }).catch(err => console.error('StageEntry create error:', err));

    // 3. Handle Offer Extended
    if (status === 'OFFER_EXTENDED') {
      const ctc = Number(offerCtc) || updatedApp.drive?.ctc || 10;
      const existingOffer = await prisma.offer.findFirst({
        where: {
          studentId: updatedApp.studentId,
          driveId: updatedApp.driveId,
        }
      });

      if (existingOffer) {
        await prisma.offer.update({
          where: { id: existingOffer.id },
          data: { ctc, status: 'PENDING' }
        }).catch(() => {});
      } else {
        await prisma.offer.create({
          data: {
            studentId: updatedApp.studentId,
            driveId: updatedApp.driveId,
            ctc,
            status: 'PENDING'
          }
        }).catch(() => {});
      }
    }

    // 4. Handle Offer Accepted
    if (status === 'OFFER_ACCEPTED') {
      const existingOffer = await prisma.offer.findFirst({
        where: {
          studentId: updatedApp.studentId,
          driveId: updatedApp.driveId,
        }
      });

      if (existingOffer) {
        await prisma.offer.update({
          where: { id: existingOffer.id },
          data: { status: 'ACCEPTED' }
        }).catch(() => {});
      } else {
        await prisma.offer.create({
          data: {
            studentId: updatedApp.studentId,
            driveId: updatedApp.driveId,
            ctc: updatedApp.drive?.ctc || 10,
            status: 'ACCEPTED'
          }
        }).catch(() => {});
      }

      await prisma.student.update({
        where: { id: updatedApp.studentId },
        data: { placementStatus: 'PLACED' }
      }).catch(() => {});
    }

    // 5. Handle Offer Declined / Withdrawn
    if (status === 'WITHDRAWN') {
      await prisma.offer.updateMany({
        where: { studentId: updatedApp.studentId, driveId: updatedApp.driveId },
        data: { status: 'DECLINED' }
      }).catch(() => {});
    }

    // Return complete updated application object
    const finalApp = await prisma.application.findUnique({
      where: { id },
      include: { 
        stageHistory: { orderBy: { date: 'asc' } },
        student: { select: { id: true, name: true, rollNo: true, branch: true, cgpa: true } },
        drive: { select: { id: true, role: true, ctc: true, company: { select: { name: true } } } }
      }
    });

    return NextResponse.json({ application: finalApp });
  } catch (error: any) {
    console.error('Error in PUT /api/applications/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
