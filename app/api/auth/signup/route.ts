import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { setAuthCookie, JWTPayload } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role, name } = body;

    if (!email || !password || !role || !name) {
      return NextResponse.json({ error: 'Email, password, role, and name are required' }, { status: 400 });
    }

    const normalizedRole = role.toUpperCase();
    if (!['STUDENT', 'COMPANY', 'TPO'].includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    let profileId: string | undefined = undefined;

    // Create User + Profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: normalizedRole,
        }
      });

      if (normalizedRole === 'STUDENT') {
        const rollNo = body.rollNo?.trim() || `0${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        
        // Check if rollNo already exists
        const existingRoll = await tx.student.findUnique({ where: { rollNo } });
        if (existingRoll) {
          throw new Error('A student with this Roll Number already exists');
        }

        const cgpa = Number(body.cgpa) || 7.5;
        const student = await tx.student.create({
          data: {
            userId: user.id,
            name: name.trim(),
            rollNo: rollNo,
            branch: body.branch || 'AI-DS',
            year: Number(body.year) || 4,
            cgpa: cgpa,
            backlogs: Number(body.backlogs) || 0,
            phone: body.phone ? String(body.phone).replace(/[^0-9]/g, '') : null,
            class10: Number(body.class10) || 85,
            class12: Number(body.class12) || 85,
            graduationYear: Number(body.graduationYear) || 2027,
            placementStatus: 'UNPLACED',
            dreamEligible: cgpa >= 8.5,
            resumeVerified: false,
            skillsJson: JSON.stringify(body.skills && body.skills.length > 0 ? body.skills : ['React.js', 'Node.js', 'Problem Solving']),
          }
        });
        profileId = student.id;
      } else if (normalizedRole === 'COMPANY') {
        const company = await tx.company.create({
          data: {
            userId: user.id,
            name: name.trim(),
            tier: body.tier || 'TIER_2',
            industry: body.industry || 'Technology',
            website: body.website || null,
            contactPerson: body.contactPerson || name.trim(),
            logo: body.name ? body.name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase() : 'CO',
          }
        });
        profileId = company.id;
      } else if (normalizedRole === 'TPO') {
        const tpo = await tx.tPOAdmin.create({
          data: {
            userId: user.id,
            name: name.trim(),
          }
        });
        profileId = tpo.id;
      }

      return user;
    });

    const payload: JWTPayload = {
      userId: newUser.id,
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: name.trim(),
      profileId,
    };

    await setAuthCookie(payload);

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: name.trim(),
        profileId,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
