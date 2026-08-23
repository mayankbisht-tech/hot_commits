import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const GRAD_YEARS_FILE = path.join(process.cwd(), 'data-grad-years.json');
const DEFAULT_GRAD_YEARS = ['2027', '2028', '2029', '2030'];

function loadGradYears(): string[] {
  try {
    if (fs.existsSync(GRAD_YEARS_FILE)) {
      const data = fs.readFileSync(GRAD_YEARS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading grad years file:', e);
  }
  return DEFAULT_GRAD_YEARS;
}

function saveGradYears(years: string[]) {
  try {
    fs.writeFileSync(GRAD_YEARS_FILE, JSON.stringify(years, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving grad years file:', e);
  }
}

// GET /api/grad-years - Fetch current graduation years
export async function GET() {
  const years = loadGradYears();
  return NextResponse.json({ years });
}

// POST /api/grad-years - Add a new graduation year (TPO Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO Admin access required.' }, { status: 403 });
    }

    const { year } = await req.json();
    const cleanYear = String(year)?.trim();

    if (!cleanYear || isNaN(Number(cleanYear))) {
      return NextResponse.json({ error: 'Valid graduation year is required' }, { status: 400 });
    }

    const years = loadGradYears();
    if (!years.includes(cleanYear)) {
      years.push(cleanYear);
      years.sort((a, b) => Number(a) - Number(b));
      saveGradYears(years);
    }

    return NextResponse.json({ success: true, years });
  } catch (error: any) {
    console.error('Error adding graduation year:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/grad-years?year=2031 - Remove a graduation year (TPO Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const yearToDelete = searchParams.get('year')?.trim();

    if (!yearToDelete) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    let years = loadGradYears();
    years = years.filter(y => y !== yearToDelete);
    if (years.length === 0) {
      years = DEFAULT_GRAD_YEARS;
    }
    saveGradYears(years);

    return NextResponse.json({ success: true, years });
  } catch (error: any) {
    console.error('Error deleting graduation year:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
