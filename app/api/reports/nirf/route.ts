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
    const academicYear = searchParams.get('academicYear') || '2023-2024';

    // In a real scenario, you would filter by academicYear.
    // For this example, we'll aggregate overall data.

    const students = await prisma.student.findMany({
      include: {
        offers: true,
      }
    });

    const totalEligible = students.length;
    const totalPlaced = students.filter(s => s.placementStatus === 'PLACED').length;
    const placementRate = totalEligible > 0 ? (totalPlaced / totalEligible) * 100 : 0;

    const offers = await prisma.offer.findMany({
      include: {
        drive: {
          include: {
            company: true
          }
        }
      }
    });

    const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
    
    let highestCTC = 0;
    let highestCTCCompany = null;
    let totalCTC = 0;
    const ctcValues: number[] = [];

    acceptedOffers.forEach(o => {
      totalCTC += o.ctc;
      ctcValues.push(o.ctc);
    });

    offers.forEach(o => {
      if (o.ctc > highestCTC) {
        highestCTC = o.ctc;
        highestCTCCompany = o.drive?.company?.name || null;
      }
    });

    const averageCTC = acceptedOffers.length > 0 ? totalCTC / acceptedOffers.length : 0;
    
    ctcValues.sort((a, b) => a - b);
    let medianCTC = 0;
    if (ctcValues.length > 0) {
      const mid = Math.floor(ctcValues.length / 2);
      medianCTC = ctcValues.length % 2 !== 0 ? ctcValues[mid] : (ctcValues[mid - 1] + ctcValues[mid]) / 2;
    }

    // Branch stats
    const branchMap: Record<string, any> = {};
    students.forEach(s => {
      const b = s.branch || 'Unknown';
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
      const avg = count > 0 ? sum / count : 0;
      const highest = count > 0 ? Math.max(...b.offers) : 0;
      
      b.offers.sort((a: number, b2: number) => a - b2);
      let median = 0;
      if (count > 0) {
        const mid = Math.floor(count / 2);
        median = count % 2 !== 0 ? b.offers[mid] : (b.offers[mid - 1] + b.offers[mid]) / 2;
      }

      return {
        branch: b.branch,
        eligible: b.eligible,
        placed: b.placed,
        avgCTC: avg,
        medianCTC: median,
        highestCTC: highest
      };
    });

    // CTC Bands
    const ctcBandsMap = {
      '< 6 LPA': 0,
      '6 - 10 LPA': 0,
      '10 - 15 LPA': 0,
      '> 15 LPA': 0
    };

    ctcValues.forEach(ctc => {
      if (ctc < 6) ctcBandsMap['< 6 LPA']++;
      else if (ctc <= 10) ctcBandsMap['6 - 10 LPA']++;
      else if (ctc <= 15) ctcBandsMap['10 - 15 LPA']++;
      else ctcBandsMap['> 15 LPA']++;
    });

    const ctcBands = Object.keys(ctcBandsMap).map(k => ({
      band: k,
      count: ctcBandsMap[k as keyof typeof ctcBandsMap]
    }));

    // Monthly Offers
    const monthlyOffersMap: Record<string, number> = {};
    acceptedOffers.forEach(o => {
      if (o.offeredOn) {
        const month = new Date(o.offeredOn).toLocaleString('default', { month: 'short' });
        monthlyOffersMap[month] = (monthlyOffersMap[month] || 0) + 1;
      }
    });
    
    const monthlyOffers = Object.keys(monthlyOffersMap).map(k => ({
      month: k,
      offers: monthlyOffersMap[k]
    }));

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
      ctcBands,
      monthlyOffers,
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
