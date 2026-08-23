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

    if (user.role === 'STUDENT') {
      let student = user.student;
      if (!student) {
        student = await prisma.student.findUnique({ where: { userId: user.id } });
      }
      if (student) {
        profileId = student.id;
        name = student.name;
      }
    } else if (user.role === 'COMPANY') {
      let company = user.company;
      if (!company) {
        company = await prisma.company.findUnique({ where: { userId: user.id } });
      }
      if (company) {
        profileId = company.id;
        name = company.name;
      }
    } else if (user.role === 'TPO') {
      let tpo = user.tpo;
      if (!tpo) {
        tpo = await prisma.tPOAdmin.findUnique({ where: { userId: user.id } });
      }
      if (tpo) {
        profileId = tpo.id;
        name = tpo.name;
      }
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
