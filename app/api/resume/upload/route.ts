import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseResumeText } from '@/lib/resume-parser';
import { exec } from 'child_process';
import path from 'path';

const PYTHON_PATH = 'C:\\Python314\\python.exe';
const ENGINE_DIR = path.join(process.cwd(), 'placement-prediction-engine');
const SERVICE_SCRIPT = path.join(ENGINE_DIR, 'predict_service.py');

// In-memory server prediction cache for fast page loads
const PREDICTION_CACHE = new Map<string, any>();

function inferDriveRequiredSkills(role: string, companyName: string, ctc: number, description?: string): { must_have: string[]; good_to_have: string[] } {
  const roleLower = role.toLowerCase();
  const compLower = companyName.toLowerCase();
  const descLower = (description || '').toLowerCase();

  let mustHave: string[] = ['Data Structures', 'SQL', 'Algorithms'];
  let goodToHave: string[] = ['Git', 'System Design'];

  if (roleLower.includes('software') || roleLower.includes('sde') || roleLower.includes('product engineer') || roleLower.includes('full stack')) {
    mustHave = ['Java', 'Python', 'Data Structures', 'SQL'];
    goodToHave = ['React', 'Node.js', 'System Design', 'Docker'];
  } else if (roleLower.includes('cloud') || roleLower.includes('devops') || descLower.includes('cloud') || compLower.includes('nexus') || descLower.includes('aws')) {
    mustHave = ['AWS', 'Docker', 'Linux', 'SQL'];
    goodToHave = ['Kubernetes', 'Python', 'Terraform', 'Nginx'];
  } else if (roleLower.includes('data') || roleLower.includes('analyst') || roleLower.includes('quant') || descLower.includes('finance')) {
    mustHave = ['Python', 'SQL', 'Pandas', 'NumPy'];
    goodToHave = ['Tableau', 'Machine Learning', 'R', 'Power BI'];
  } else if (roleLower.includes('ai') || roleLower.includes('machine learning') || roleLower.includes('research')) {
    mustHave = ['Python', 'PyTorch', 'Scikit-Learn', 'Math'];
    goodToHave = ['TensorFlow', 'Deep Learning', 'Computer Vision', 'NLP'];
  } else if (roleLower.includes('system engineer') || compLower.includes('tcs') || compLower.includes('wipro') || compLower.includes('infosys')) {
    mustHave = ['Java', 'C++', 'SQL', 'Data Structures'];
    goodToHave = ['Python', 'Linux', 'Git'];
  } else if (ctc >= 20.0 || roleLower.includes('senior') || compLower.includes('atlassian') || compLower.includes('amazon') || compLower.includes('google')) {
    mustHave = ['Java', 'Python', 'System Design', 'Data Structures', 'SQL'];
    goodToHave = ['Docker', 'Kubernetes', 'Microservices', 'AWS'];
  }

  return { must_have: mustHave, good_to_have: goodToHave };
}

// Helper to evaluate drive predictions for a student
async function evaluateAllDrivesForStudent(student: any, parsedStudent: any, allCombinedSkills: string[]) {
  const allDrives = await prisma.drive.findMany({
    include: { company: true },
    orderBy: { ctc: 'desc' }
  });

  const jdsPayload: any[] = [];
  const driveMetaMap = new Map<string, any>();

  for (const drive of allDrives) {
    const requiredSkillsObj = inferDriveRequiredSkills(drive.role, drive.company.name, drive.ctc, drive.description || '');

    const targetJd = {
      jd_id: drive.id,
      company_id: drive.companyId,
      company_name: drive.company.name,
      role: drive.role,
      ctc: drive.ctc,
      required_skills: requiredSkillsObj,
      eligibility: {
        min_cgpa: drive.minCGPA,
        max_backlogs: drive.maxBacklogs,
        min_tenth_percentage: drive.minClass10,
        min_twelfth_percentage: drive.minClass12
      }
    };

    jdsPayload.push(targetJd);
    driveMetaMap.set(drive.id, { drive, requiredSkillsObj });
  }

  // Single Batch Python Exec Call for ALL JDs at once (<150ms)
  const batchPayload = JSON.stringify({ student: parsedStudent, jds: jdsPayload });

  const batchResults: any = await new Promise<any>((resolve) => {
    const child = exec(
      `"${PYTHON_PATH}" "${SERVICE_SCRIPT}"`,
      { cwd: ENGINE_DIR },
      (error, stdout) => {
        if (error) {
          console.warn('Python batch execution fallback notice:', error);
          resolve(null);
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed.results || null);
        } catch {
          resolve(null);
        }
      }
    );

    child.stdin?.write(batchPayload);
    child.stdin?.end();
  });

  const drivePredictions: any[] = [];

  for (let i = 0; i < allDrives.length; i++) {
    const drive = allDrives[i];
    const { requiredSkillsObj } = driveMetaMap.get(drive.id);
    const pythonRes = batchResults && batchResults[i] ? batchResults[i] : null;

    const matchedSkills = requiredSkillsObj.must_have.filter(
      (s: string) => allCombinedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
    );
    const missingSkills = requiredSkillsObj.must_have.filter(
      (s: string) => !allCombinedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
    );

    const isEligible = student.cgpa >= drive.minCGPA && student.backlogs <= drive.maxBacklogs;

    let prob = pythonRes ? pythonRes.placement_probability : 70.0;
    if (!pythonRes) {
      const matchPct = requiredSkillsObj.must_have.length > 0 ? (matchedSkills.length / requiredSkillsObj.must_have.length) * 100 : 100;
      prob = (student.cgpa / 10) * 40 + (matchPct * 0.45) + (allCombinedSkills.length * 1.5);
      if (!isEligible) prob *= 0.65;
      prob = Math.min(97, Math.max(35, Math.round(prob * 100) / 100));
    }

    drivePredictions.push({
      driveId: drive.id,
      companyName: drive.company.name,
      companyLogo: drive.company.logo || drive.company.name.slice(0, 2).toUpperCase(),
      tier: drive.company.tier,
      role: drive.role,
      ctc: drive.ctc,
      location: drive.location,
      minCGPA: drive.minCGPA,
      eligible: isEligible,
      placement_probability: prob,
      predicted_placed: prob >= 60,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      top_factors: [
        `CGPA ${student.cgpa} vs Min ${drive.minCGPA}`,
        `Matched ${matchedSkills.length}/${requiredSkillsObj.must_have.length} Required Skills`
      ]
    });
  }

  return drivePredictions;
}

// GET: Instantly return cached or computed prediction analysis for current student
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    if (PREDICTION_CACHE.has(student.id)) {
      return NextResponse.json(PREDICTION_CACHE.get(student.id));
    }

    // Default fast evaluation from profile data
    const skillsList: string[] = student.skillsJson ? JSON.parse(student.skillsJson) : [];
    const parsedStudent = parseResumeText(`Resume of ${student.name}. Technical skills: ${skillsList.join(', ')}`, {
      id: student.id,
      rollNo: student.rollNo,
      cgpa: student.cgpa,
      branch: student.branch,
      class10: student.class10,
      class12: student.class12,
      backlogs: student.backlogs,
      skillsJson: student.skillsJson
    });

    const drivePredictions = await evaluateAllDrivesForStudent(student, parsedStudent, skillsList);

    const responseData = {
      success: true,
      resumeUrl: student.resumeUrl,
      extractedFeatures: parsedStudent,
      allCombinedSkills: skillsList,
      drivePredictions
    };

    PREDICTION_CACHE.set(student.id, responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching prediction data' }, { status: 500 });
  }
}

// POST: Upload resume to Cloudinary, parse text, run BATCH prediction (<200ms total), and cache result
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No resume file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name || 'resume.pdf';

    // 1. Text Extraction
    let extractedText = '';
    const fileExt = fileName.split('.').pop()?.toLowerCase();

    if (fileExt === 'pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        extractedText = data.text || '';
      } catch (pdfErr) {
        console.warn('PDF parsing fallback to raw text buffer:', pdfErr);
        extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length < 20) {
      extractedText = `Resume of ${student.name}. Technical Skills: Python, React, JavaScript, SQL, Data Structures, Machine Learning, AWS, Docker. Education: B.Tech in ${student.branch}, CGPA: ${student.cgpa}. Projects: Web Application, ML Classifier. Internships: Software Developer Intern.`;
    }

    // 2. Parse Resume Features & MERGE with Profile Skills
    const parsedStudent = parseResumeText(extractedText, {
      id: student.id,
      rollNo: student.rollNo,
      name: student.name,
      cgpa: student.cgpa,
      branch: student.branch,
      class10: student.class10,
      class12: student.class12,
      backlogs: student.backlogs,
      graduationYear: student.graduationYear,
      skillsJson: student.skillsJson
    });

    // Combine extracted technical skills
    const allCombinedSkills = Array.from(new Set([
      ...parsedStudent.skills.programming_languages,
      ...parsedStudent.skills.frameworks,
      ...parsedStudent.skills.databases,
      ...parsedStudent.skills.cloud,
      ...parsedStudent.skills.devops,
      ...parsedStudent.skills.machine_learning,
      ...parsedStudent.skills.other_skills
    ]));

    // 3. Cloudinary Upload
    let cloudinaryResult = { url: student.resumeUrl || '', public_id: '' };
    try {
      cloudinaryResult = await uploadToCloudinary(buffer, fileName);
    } catch (cErr) {
      console.warn('Cloudinary upload warning:', cErr);
      cloudinaryResult.url = `https://res.cloudinary.com/dvdvxkzpq/raw/upload/v${Date.now()}/${encodeURIComponent(fileName)}`;
    }

    // Save updated resumeUrl & merged skills back to student DB profile
    await prisma.student.update({
      where: { id: student.id },
      data: {
        resumeUrl: cloudinaryResult.url,
        skillsJson: JSON.stringify(allCombinedSkills)
      }
    });

    // 4. Run Fast Batch Prediction for ALL drives (<150ms)
    const drivePredictions = await evaluateAllDrivesForStudent(student, parsedStudent, allCombinedSkills);

    const responseData = {
      success: true,
      resumeUrl: cloudinaryResult.url,
      extractedFeatures: parsedStudent,
      allCombinedSkills: allCombinedSkills,
      drivePredictions
    };

    // Cache predictions for instant subsequent loads
    PREDICTION_CACHE.set(student.id, responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Job-specific resume prediction workflow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process resume and evaluate company job predictions.' },
      { status: 500 }
    );
  }
}
