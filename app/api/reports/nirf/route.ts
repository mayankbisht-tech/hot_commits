import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get('academicYear') || '2026-2027';

    const [students, offers] = await Promise.all([
      prisma.student.findMany({
        include: { offers: true }
      }),
      prisma.offer.findMany({
        include: {
          drive: {
            include: { company: true }
          }
        }
      })
    ]);

    const totalEligible = students.length;
    const totalPlaced = students.filter(s => s.placementStatus === 'PLACED').length;
    const placementRate = totalEligible > 0 ? Number(((totalPlaced / totalEligible) * 100).toFixed(1)) : 0;

    const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
    
    let highestCTC = 0;
    let highestCTCCompany = "None";
    let totalCTC = 0;
    const ctcValues: number[] = [];

    acceptedOffers.forEach(o => {
      totalCTC += o.ctc;
      ctcValues.push(o.ctc);
    });

    offers.forEach(o => {
      if (o.ctc > highestCTC) {
        highestCTC = o.ctc;
        highestCTCCompany = o.drive?.company?.name || highestCTCCompany;
      }
    });

    const averageCTC = acceptedOffers.length > 0 ? Number((totalCTC / acceptedOffers.length).toFixed(1)) : 0;
    
    ctcValues.sort((a, b) => a - b);
    let medianCTC = 0;
    if (ctcValues.length > 0) {
      const mid = Math.floor(ctcValues.length / 2);
      medianCTC = ctcValues.length % 2 !== 0 ? ctcValues[mid] : (ctcValues[mid - 1] + ctcValues[mid]) / 2;
    }

    // Branch stats
    const branchMap: Record<string, { branch: string; eligible: number; placed: number; offers: number[] }> = {};
    students.forEach(s => {
      const b = s.branch || 'AI-DS';
      if (!branchMap[b]) {
        branchMap[b] = { branch: b, eligible: 0, placed: 0, offers: [] };
      }
      branchMap[b].eligible += 1;
      if (s.placementStatus === 'PLACED') {
        branchMap[b].placed += 1;
      }
      
      const accOffers = s.offers.filter((o: any) => o.status === 'ACCEPTED').map((o: any) => o.ctc);
      if (accOffers.length > 0) {
        branchMap[b].offers.push(Math.max(...accOffers));
      }
    });

    const branchStats = Object.values(branchMap).map((b: any) => {
      const count = b.offers.length;
      const sum = b.offers.reduce((a: number, curr: number) => a + curr, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;
      const highest = count > 0 ? Math.max(...b.offers) : 0;
      
      b.offers.sort((a: number, b2: number) => a - b2);
      let median = 0;
      if (count > 0) {
        const mid = Math.floor(count / 2);
        median = count % 2 !== 0 ? b.offers[mid] : (b.offers[mid - 1] + b.offers[mid]) / 2;
      }

      const rate = b.eligible > 0 ? Math.min(100, Number(((b.placed / b.eligible) * 100).toFixed(1))) : 0;

      return {
        academicYear,
        branch: b.branch,
        eligible: b.eligible,
        placed: b.placed,
        placementRate: `${rate}%`,
        avgCTC: `₹${avg} LPA`,
        medianCTC: `₹${median} LPA`,
        highestCTC: `₹${highest} LPA`
      };
    });

    const nirfData = {
      academicYear,
      totalEligible,
      totalPlaced,
      placementRate,
      averageCTC,
      medianCTC,
      highestCTC,
      highestCTCCompany,
      branchStats,
    };

    return NextResponse.json({
      data: nirfData,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching NIRF data:', error);
    return NextResponse.json({ error: 'Failed to fetch NIRF data' }, { status: 500 });
  }
}
