import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let { id } = await params;
    if (id === 'me') {
      id = session.user.profileId || session.user.id || '';
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        offers: true,
        applications: {
          include: {
            drive: { select: { role: true, ctc: true, company: { select: { name: true } } } }
          }
        }
      }
    });

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const formattedStudent = {
      ...student,
      skills: student.skillsJson ? JSON.parse(student.skillsJson) : []
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let { id } = await params;
    if (id === 'me') {
      id = session.user.profileId || session.user.id || '';
    }

    const isTpo = session.user.role === 'TPO';
    const isOwnProfile = session.user.role === 'STUDENT' && (session.user.profileId === id || session.user.id === id);

    if (!isTpo && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.branch !== undefined) updateData.branch = body.branch;
    if (body.graduationYear !== undefined) updateData.graduationYear = Number(body.graduationYear);
    if (body.cgpa !== undefined) {
      const parsedCgpa = parseFloat(body.cgpa);
      updateData.cgpa = parsedCgpa;
      updateData.dreamEligible = parsedCgpa >= 8.5;
    }
    if (body.backlogs !== undefined) updateData.backlogs = Number(body.backlogs);
    if (body.class10 !== undefined) updateData.class10 = parseFloat(body.class10);
    if (body.class12 !== undefined) updateData.class12 = parseFloat(body.class12);
    if (body.skills !== undefined) {
      updateData.skillsJson = JSON.stringify(body.skills);
    }

    if (isTpo) {
      if (body.resumeVerified !== undefined) updateData.resumeVerified = body.resumeVerified;
      if (body.placementStatus !== undefined) updateData.placementStatus = body.placementStatus;
      if (body.dreamEligible !== undefined) updateData.dreamEligible = body.dreamEligible;
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData
    });

    const formattedStudent = {
      ...updatedStudent,
      skills: updatedStudent.skillsJson ? JSON.parse(updatedStudent.skillsJson) : []
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error: any) {
    console.error('Error updating student profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
