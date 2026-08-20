import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let whereClause: any = {};
    if (branch && branch !== 'All') whereClause.branch = branch;
    if (status && status !== 'All') whereClause.placementStatus = status.toUpperCase();
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { rollNo: { contains: search } }
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: { select: { email: true } },
        offers: true,
        _count: { select: { applications: true } }
      },
      orderBy: { name: 'asc' }
    });

    const formattedStudents = students.map((s: any) => ({
      ...s,
      skills: s.skillsJson ? JSON.parse(s.skillsJson) : []
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
