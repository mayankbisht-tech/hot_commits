import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';

const PYTHON_PATH = 'C:\\Python314\\python.exe';
const ENGINE_DIR = path.join(process.cwd(), 'placement-prediction-engine');
const SERVICE_SCRIPT = path.join(ENGINE_DIR, 'predict_service.py');

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student, jd } = await req.json();
    if (!student || !jd) {
      return NextResponse.json({ error: 'Student and JD objects are required.' }, { status: 400 });
    }

    const payload = JSON.stringify({ student, jd });

    const result = await new Promise<any>((resolve, reject) => {
      const child = exec(
        `"${PYTHON_PATH}" "${SERVICE_SCRIPT}"`,
        { cwd: ENGINE_DIR },
        (error, stdout, stderr) => {
          if (error) {
            console.error('Subprocess run error:', error);
            reject(new Error(stderr || error.message));
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim());
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Failed to parse ML output: ${stdout}. Error: ${e.message}`));
          }
        }
      );

      // Write request body payload to stdin
      child.stdin?.write(payload);
      child.stdin?.end();
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Prediction API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
