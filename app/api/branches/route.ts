import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const BRANCHES_FILE = path.join(process.cwd(), 'data-branches.json');
const DEFAULT_BRANCHES = ['AI-DS', 'AI-ML', 'AR', 'IIOT'];

function loadBranches(): string[] {
  try {
    if (fs.existsSync(BRANCHES_FILE)) {
      const data = fs.readFileSync(BRANCHES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading branches file:', e);
  }
  return DEFAULT_BRANCHES;
}

function saveBranches(branches: string[]) {
  try {
    fs.writeFileSync(BRANCHES_FILE, JSON.stringify(branches, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving branches file:', e);
  }
}

// GET /api/branches - Fetch current active branches
export async function GET() {
  const branches = loadBranches();
  return NextResponse.json({ branches });
}

// POST /api/branches - Add a new branch (TPO Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO Admin access required.' }, { status: 403 });
    }

    const { branch } = await req.json();
    const cleanBranch = branch?.trim()?.toUpperCase();

    if (!cleanBranch) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const branches = loadBranches();
    if (!branches.includes(cleanBranch)) {
      branches.push(cleanBranch);
      saveBranches(branches);
    }

    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to add branch' }, { status: 500 });
  }
}

// DELETE /api/branches - Remove a branch (TPO Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchToDelete = searchParams.get('branch')?.trim()?.toUpperCase();

    if (!branchToDelete) {
      return NextResponse.json({ error: 'Branch parameter is required' }, { status: 400 });
    }

    let branches = loadBranches();
    branches = branches.filter(b => b !== branchToDelete);
    saveBranches(branches);

    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete branch' }, { status: 500 });
  }
}
