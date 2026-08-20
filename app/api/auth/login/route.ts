import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { setAuthCookie, JWTPayload } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Look up user with relations
    let user = null;
    let attempts = 0;
    while (attempts < 2 && !user) {
      try {
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: {
            student: true,
            company: true,
            tpo: true,
          }
        });
        break;
      } catch (dbErr) {
        attempts++;
        if (attempts >= 2) throw dbErr;
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let profileId: string | undefined = undefined;
    let name = user.email;
    if (user.role === 'STUDENT' && user.student) {
      profileId = user.student.id;
      name = user.student.name;
    } else if (user.role === 'COMPANY' && user.company) {
      profileId = user.company.id;
      name = user.company.name;
    } else if (user.role === 'TPO' && user.tpo) {
      profileId = user.tpo.id;
      name = user.tpo.name;
    }

    const payload: JWTPayload = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name,
      profileId,
    };

    await setAuthCookie(payload);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        profileId,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
