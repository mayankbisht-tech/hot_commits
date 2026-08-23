import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let student = null;

    if (user.role === 'STUDENT') {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { id: user.profileId || '' },
            { userId: user.userId || '' },
            { userId: user.id || '' },
            { user: { email: user.email?.toLowerCase().trim() || '' } }
          ]
        },
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
    }

    // Direct fallback by user email if not resolved yet
    if (!student && user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase().trim() },
        include: {
          student: {
            include: {
              user: { select: { email: true } },
              offers: true,
              applications: {
                include: {
                  drive: { select: { role: true, ctc: true, company: { select: { name: true } } } }
                }
              }
            }
          }
        }
      });
      if (dbUser?.student) {
        student = dbUser.student;
      }
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found for this user' }, { status: 404 });
    }

    const formattedStudent = {
      ...student,
      email: student.user?.email || user.email || '',
      skills: student.skillsJson ? JSON.parse(student.skillsJson) : []
    };

    return NextResponse.json({ student: formattedStudent });
  } catch (error: any) {
    console.error('Error fetching student me:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Find student strictly belonging to the logged-in user
    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: user.profileId || '' },
          { userId: user.userId || '' },
          { userId: user.id || '' },
          { user: { email: user.email?.toLowerCase().trim() || '' } }
        ]
      }
    });

    if (!student && user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase().trim() },
        include: { student: true }
      });
      if (dbUser?.student) {
        student = dbUser.student;
      }
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const updateData: any = {};

    // Validate phone number if provided (must be 10 digits)
    if (body.phone !== undefined) {
      const rawDigits = String(body.phone).replace(/[^0-9]/g, '');
      if (rawDigits.length !== 10) {
        return NextResponse.json({ error: 'The phone number cannot be saved if its not 10 digits.' }, { status: 400 });
      }
      updateData.phone = rawDigits;
    }

    // Validate email if provided
    if (body.email !== undefined) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const emailStr = String(body.email).trim().toLowerCase();
      if (!emailRegex.test(emailStr)) {
        return NextResponse.json({ error: 'The email cannot be saved without a valid domain.' }, { status: 400 });
      }
      try {
        await prisma.user.update({
          where: { id: student.userId },
          data: { email: emailStr }
        });
      } catch (err: any) {
        console.warn('Could not update user email record:', err.message);
      }
    }

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

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: updateData,
      include: {
        user: { select: { email: true } },
        offers: true,
        applications: true
      }
    });

    const formattedStudent = {
      ...updatedStudent,
      email: updatedStudent.user?.email || body.email || '',
      skills: updatedStudent.skillsJson ? JSON.parse(updatedStudent.skillsJson) : []
    };

    return NextResponse.json({ 
      success: true, 
      message: 'details updated successfully', 
      student: formattedStudent 
    });
  } catch (error: any) {
    console.error('Error updating student profile me:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
