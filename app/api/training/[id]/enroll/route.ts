import { NextRequest, NextResponse } from 'next/server';
import prisma, { withRetry } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized. STUDENT access required.' }, { status: 403 });
    }

    const rawParams = await context.params;
    const programId = rawParams?.id;
    
    // Resolve Student ID
    let studentId = session.user.profileId;
    if (!studentId) {
      const studentRecord = await withRetry(() => prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: session.user.userId },
            { user: { email: session.user.email?.toLowerCase().trim() || '' } }
          ]
        }
      }));
      studentId = studentRecord?.id || session.user.id;
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID not found' }, { status: 400 });
    }

    const program = await withRetry(() => prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    }));

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.capacity && program._count.enrollments >= program.capacity) {
      return NextResponse.json({ error: 'Program is full' }, { status: 400 });
    }

    const enrollment = await withRetry(() => prisma.enrollment.upsert({
      where: {
        studentId_trainingProgramId: {
          studentId,
          trainingProgramId: programId,
        },
      },
      update: {},
      create: {
        studentId,
        trainingProgramId: programId,
      },
    }));

    // Auto-update student skills in profile when enrolling in training
    try {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student) {
        let existingSkills: string[] = [];
        try {
          existingSkills = student.skillsJson ? JSON.parse(student.skillsJson) : [];
        } catch {
          existingSkills = [];
        }

        // Extract skills from program tagsJson, title, and description
        const tags: string[] = program.tagsJson ? JSON.parse(program.tagsJson) : [];
        const candidateText = `${program.title} ${program.description || ''} ${tags.join(' ')}`;
        
        // Common skills list to detect from text
        const knownSkills = [
          'Python', 'SQL', 'Java', 'C++', 'JavaScript', 'TypeScript', 'React', 'Node.js',
          'Express', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Linux',
          'Machine Learning', 'Data Structures', 'Algorithms', 'System Design', 'Django',
          'Spring Boot', 'MongoDB', 'PostgreSQL', 'HTML', 'CSS', 'Tailwind', 'REST API'
        ];

        const newlyAcquiredSkills = new Set<string>(tags);
        for (const skill of knownSkills) {
          if (candidateText.toLowerCase().includes(skill.toLowerCase())) {
            newlyAcquiredSkills.add(skill);
          }
        }

        if (newlyAcquiredSkills.size > 0) {
          const skillSet = new Set(existingSkills);
          newlyAcquiredSkills.forEach(s => skillSet.add(s));
          const updatedSkills = Array.from(skillSet);

          await prisma.student.update({
            where: { id: studentId },
            data: { skillsJson: JSON.stringify(updatedSkills) }
          });
        }
      }
    } catch (e) {
      console.error('Error auto-updating student profile skills on training enrollment:', e);
    }

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error: any) {
    console.error('Error enrolling in training:', error);
    return NextResponse.json({ error: error.message || 'Failed to enroll in program' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized. STUDENT access required.' }, { status: 403 });
    }

    const rawParams = await context.params;
    const programId = rawParams?.id;
    
    let studentId = session.user.profileId;
    if (!studentId) {
      const studentRecord = await withRetry(() => prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: session.user.userId },
            { user: { email: session.user.email?.toLowerCase().trim() || '' } }
          ]
        }
      }));
      studentId = studentRecord?.id || session.user.id;
    }

    const enrollment = await withRetry(() => prisma.enrollment.findFirst({
      where: {
        trainingProgramId: programId,
        studentId,
      },
    }));

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment record not found' }, { status: 404 });
    }

    await withRetry(() => prisma.enrollment.delete({
      where: {
        id: enrollment.id,
      },
    }));

    return NextResponse.json({ success: true, message: 'Successfully unenrolled from program' });
  } catch (error: any) {
    console.error('Error unenrolling from training:', error);
    return NextResponse.json({ error: error.message || 'Failed to unenroll from program' }, { status: 500 });
  }
}
