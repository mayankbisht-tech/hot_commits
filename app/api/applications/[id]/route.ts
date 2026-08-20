import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: { drive: true }
    });

    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const { status, note, interviewDate, offerCtc } = await req.json();

    // Process side effects in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id },
        data: { status },
        include: { drive: true }
      });

      const readableStage = 
        status === 'APPLIED' ? 'Applied' :
        status === 'SHORTLISTED' ? 'Shortlisted' :
        status === 'INTERVIEW_SCHEDULED' ? 'Interview Scheduled' :
        status === 'OFFER_EXTENDED' ? 'Offer Extended' :
        status === 'OFFER_ACCEPTED' ? 'Offer Accepted' :
        status === 'REJECTED' ? 'Rejected' :
        status === 'WITHDRAWN' ? 'Offer Declined' : status;

      await tx.stageEntry.create({
        data: {
          applicationId: id,
          stage: readableStage,
          note: note || (status === 'REJECTED' ? 'Application not moving forward' : null),
          date: interviewDate ? new Date(interviewDate) : new Date()
        }
      });

      if (status === 'OFFER_EXTENDED') {
        const ctc = Number(offerCtc) || updatedApp.drive?.ctc || 10;
        const existingOffer = await tx.offer.findFirst({
          where: {
            studentId: updatedApp.studentId,
            driveId: updatedApp.driveId,
          }
        });

        if (existingOffer) {
          await tx.offer.update({
            where: { id: existingOffer.id },
            data: { ctc, status: 'PENDING' }
          });
        } else {
          await tx.offer.create({
            data: {
              studentId: updatedApp.studentId,
              driveId: updatedApp.driveId,
              ctc,
              status: 'PENDING'
            }
          });
        }
      }

      if (status === 'OFFER_ACCEPTED') {
        const existingOffer = await tx.offer.findFirst({
          where: {
            studentId: updatedApp.studentId,
            driveId: updatedApp.driveId,
          }
        });

        if (existingOffer) {
          await tx.offer.update({
            where: { id: existingOffer.id },
            data: { status: 'ACCEPTED' }
          });
        } else {
          await tx.offer.create({
            data: {
              studentId: updatedApp.studentId,
              driveId: updatedApp.driveId,
              ctc: updatedApp.drive?.ctc || 10,
              status: 'ACCEPTED'
            }
          });
        }

        await tx.student.update({
          where: { id: updatedApp.studentId },
          data: { placementStatus: 'PLACED' }
        });
      }

      if (status === 'WITHDRAWN') {
        await tx.offer.updateMany({
          where: { studentId: updatedApp.studentId, driveId: updatedApp.driveId },
          data: { status: 'DECLINED' }
        });
      }

      return await tx.application.findUnique({
        where: { id },
        include: { 
          stageHistory: { orderBy: { date: 'asc' } },
          student: { select: { id: true, name: true, rollNo: true, branch: true, cgpa: true } },
          drive: { select: { id: true, role: true, ctc: true, company: { select: { name: true } } } }
        }
      });
    });

    return NextResponse.json({ application: result });
  } catch (error: any) {
    console.error('Error in PUT /api/applications/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
