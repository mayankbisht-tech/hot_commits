import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userPayload = await getCurrentUser();
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch fresh user details from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: userPayload.userId || userPayload.id },
      include: {
        student: { select: { id: true, name: true, rollNo: true, branch: true } },
        company: { select: { id: true, name: true } },
        tpo: { select: { id: true, name: true } }
      }
    });

    if (dbUser) {
      let name = userPayload.name;
      let profileId = userPayload.profileId;

      if (dbUser.role === 'STUDENT' && dbUser.student) {
        name = dbUser.student.name;
        profileId = dbUser.student.id;
      } else if (dbUser.role === 'COMPANY' && dbUser.company) {
        name = dbUser.company.name;
        profileId = dbUser.company.id;
      } else if (dbUser.role === 'TPO' && dbUser.tpo) {
        name = dbUser.tpo.name;
        profileId = dbUser.tpo.id;
      }

      return NextResponse.json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          name,
          profileId,
        }
      });
    }

    return NextResponse.json({ user: userPayload });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
