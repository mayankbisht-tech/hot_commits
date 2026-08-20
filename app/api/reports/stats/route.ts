import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

let cachedStats: any = null;
let cacheTime = 0;
const CACHE_TTL_MS = 4000; // 4 second in-memory cache

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TPO') {
      return NextResponse.json({ error: 'Unauthorized. TPO access required.' }, { status: 403 });
    }

    const now = Date.now();
    if (cachedStats && (now - cacheTime < CACHE_TTL_MS)) {
      return NextResponse.json(cachedStats);
    }

    // Execute all independent database queries in parallel for high performance
    const [
      totalStudents,
      totalPlaced,
      totalDrives,
      activeDrives,
      totalApplications,
      offers,
      students,
      trainingPrograms
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { placementStatus: 'PLACED' } }),
      prisma.drive.count(),
      prisma.drive.count({ where: { status: 'ACTIVE' } }),
      prisma.application.count(),
      prisma.offer.findMany({
        include: {
          drive: {
            include: { company: true }
          }
        }
      }),
      prisma.student.findMany({
        include: { offers: true }
      }),
      prisma.trainingProgram.findMany({
        include: { enrollments: true }
      })
    ]);

    const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
    
    let totalCTC = 0;
    let highestCTC = 0;
    let highestCTCCompany = null;

    acceptedOffers.forEach(o => {
      totalCTC += o.ctc;
    });

    offers.forEach(o => {
      if (o.ctc > highestCTC) {
        highestCTC = o.ctc;
        highestCTCCompany = o.drive?.company?.name || null;
      }
    });

    const averageCTC = acceptedOffers.length > 0 ? totalCTC / acceptedOffers.length : 0;

    // branch stats
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
      
      // Calculate median
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

    // monthly offers
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

    // training participation
    const participation = { aptitude: 0, softSkills: 0, technical: 0, certification: 0 };
    const typeCount = { aptitude: 0, softSkills: 0, technical: 0, certification: 0 };

    trainingPrograms.forEach(p => {
      const t = p.type?.toLowerCase();
      const attendedCount = p.enrollments.filter((e: any) => e.attended === true).length;
      
      if (t && typeCount[t as keyof typeof typeCount] !== undefined) {
        participation[t as keyof typeof participation] += attendedCount;
        typeCount[t as keyof typeof typeCount] += p.enrollments.length;
      }
    });

    const trainingParticipation = {
      aptitude: typeCount.aptitude > 0 ? (participation.aptitude / typeCount.aptitude) * 100 : 0,
      softSkills: typeCount.softSkills > 0 ? (participation.softSkills / typeCount.softSkills) * 100 : 0,
      technical: typeCount.technical > 0 ? (participation.technical / typeCount.technical) * 100 : 0,
      certification: typeCount.certification > 0 ? (participation.certification / typeCount.certification) * 100 : 0,
    };

    const responseData = {
      totalStudents,
      totalPlaced,
      totalDrives,
      activeDrives,
      totalApplications,
      averageCTC,
      highestCTC,
      highestCTCCompany,
      branchStats,
      monthlyOffers,
      trainingParticipation
    };

    cachedStats = responseData;
    cacheTime = Date.now();

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
