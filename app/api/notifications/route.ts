import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// In-memory persistent store for dynamic recruiter reminders
interface RecruiterReminder {
  id: string;
  studentId: string;
  companyName: string;
  role: string;
  message: string;
  createdAt: string;
  unread: boolean;
}

declare global {
  var globalReminders: RecruiterReminder[] | undefined;
  var dismissedNotificationIds: Set<string> | undefined;
}

if (!global.globalReminders) {
  global.globalReminders = [];
}
if (!global.dismissedNotificationIds) {
  global.dismissedNotificationIds = new Set<string>();
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const role = session.user.role;
    const userId = session.user.id || session.user.userId || 'user';
    const dismissed = global.dismissedNotificationIds || new Set<string>();

    if (dismissed.has(`ALL-${userId}`)) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    let notifications: any[] = [];

    if (role === 'TPO') {
      // 1. Pending Drive Approvals
      const pendingDrives = await prisma.drive.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { company: { select: { name: true, tier: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30
      });

      for (const d of pendingDrives) {
        notifications.push({
          id: `drive-${d.id}`,
          title: `Drive Approval Required`,
          desc: `${d.company.name} submitted "${d.role}" (₹${d.ctc} LPA) for placement verification.`,
          time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: d.createdAt,
          unread: true,
          type: 'drive',
          link: '/tpo'
        });
      }

      // 2. Recent Applications
      const recentApplications = await prisma.application.findMany({
        include: {
          student: { select: { name: true, branch: true } },
          drive: { select: { role: true, company: { select: { name: true } } } }
        },
        orderBy: { appliedOn: 'desc' },
        take: 30
      });

      for (const app of recentApplications) {
        notifications.push({
          id: `app-${app.id}`,
          title: `New Candidate Applied`,
          desc: `${app.student.name} (${app.student.branch}) applied to ${app.drive.company.name} - ${app.drive.role}.`,
          time: new Date(app.appliedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: app.appliedOn,
          unread: false,
          type: 'candidate',
          link: '/tpo/applicants'
        });
      }

      // 3. Accepted Offers
      const acceptedOffers = await prisma.offer.findMany({
        where: { status: 'ACCEPTED' },
        include: {
          student: { select: { name: true, branch: true } },
          drive: { select: { role: true, company: { select: { name: true } } } }
        },
        orderBy: { offeredOn: 'desc' },
        take: 20
      });

      for (const off of acceptedOffers) {
        notifications.push({
          id: `offer-${off.id}`,
          title: `Placement Offer Accepted!`,
          desc: `${off.student.name} secured offer at ${off.drive.company.name} (₹${off.ctc} LPA).`,
          time: new Date(off.offeredOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: off.offeredOn,
          unread: true,
          type: 'offer',
          link: '/tpo/reports'
        });
      }
    } else if (role === 'COMPANY') {
      const companyId = session.user.profileId;
      if (companyId) {
        const companyDrives = await prisma.drive.findMany({
          where: { companyId },
          include: {
            applications: {
              include: { student: { select: { name: true, branch: true, cgpa: true } } },
              orderBy: { appliedOn: 'desc' },
              take: 30
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        for (const cd of companyDrives) {
          if (cd.approvalStatus === 'APPROVED') {
            notifications.push({
              id: `drive-app-${cd.id}`,
              title: `Drive Approved by TPO`,
              desc: `Our placement drive "${cd.role}" is approved and active for students.`,
              time: 'Active',
              unread: false,
              type: 'drive',
              link: '/company/drives'
            });
          }
          for (const a of cd.applications) {
            notifications.push({
              id: `comp-app-${a.id}`,
              title: `New Candidate Registered`,
              desc: `${a.student.name} (${a.student.branch}, CGPA: ${a.student.cgpa}) applied for ${cd.role}.`,
              time: new Date(a.appliedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: true,
              type: 'candidate',
              link: '/company/applicants'
            });
          }
        }
      }
    } else if (role === 'STUDENT') {
      const studentId = session.user.profileId || session.user.id;
      if (studentId) {
        // 1. Recruiter Reminders sent to student
        const studentReminders = (global.globalReminders || []).filter(
          r => r.studentId === studentId || r.studentId === 'ALL'
        );

        for (const rem of studentReminders) {
          notifications.push({
            id: rem.id,
            title: `Recruiter Reminder: ${rem.companyName}`,
            desc: rem.message || `Please review and take action regarding our ${rem.role} placement offer.`,
            time: 'Urgent',
            unread: rem.unread,
            type: 'reminder',
            link: '/student/applications'
          });
        }

        // 2. Student's application status updates
        const myApps = await prisma.application.findMany({
          where: { studentId },
          include: {
            drive: { select: { role: true, company: { select: { name: true } } } },
            stageHistory: { orderBy: { date: 'desc' } }
          },
          orderBy: { appliedOn: 'desc' },
          take: 30
        });

        for (const app of myApps) {
          if (app.status === 'OFFER_EXTENDED') {
            notifications.push({
              id: `student-offer-${app.id}`,
              title: `Placement Offer Received!`,
              desc: `${app.drive.company.name} has extended an official offer for "${app.drive.role}".`,
              time: 'Action Required',
              unread: true,
              type: 'offer',
              link: '/student/applications'
            });
          } else if (app.status === 'INTERVIEW_SCHEDULED') {
            notifications.push({
              id: `student-interview-${app.id}`,
              title: `Interview Scheduled`,
              desc: `${app.drive.company.name} has scheduled your interview for "${app.drive.role}".`,
              time: 'Upcoming',
              unread: true,
              type: 'candidate',
              link: '/student/applications'
            });
          } else if (app.status === 'SHORTLISTED') {
            notifications.push({
              id: `student-shortlist-${app.id}`,
              title: `Application Shortlisted`,
              desc: `You have been shortlisted by ${app.drive.company.name} for "${app.drive.role}".`,
              time: 'Updated',
              unread: false,
              type: 'candidate',
              link: '/student/applications'
            });
          }
        }

        // 3. Active & Upcoming placement drives
        const activeDrives = await prisma.drive.findMany({
          where: { approvalStatus: 'APPROVED' },
          include: { company: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        });

        for (const ad of activeDrives) {
          notifications.push({
            id: `student-drive-${ad.id}`,
            title: `New Placement Drive: ${ad.company.name}`,
            desc: `${ad.company.name} is hiring for ${ad.role} (₹${ad.ctc} LPA). Apply before deadline.`,
            time: 'Open',
            unread: false,
            type: 'drive',
            link: '/student/drives'
          });
        }
      }
    }

    // Filter out individually dismissed notifications
    notifications = notifications.filter(n => 
      !dismissed.has(n.id) && 
      !dismissed.has(`${userId}-${n.id}`)
    );

    const unreadCount = notifications.filter(n => n.unread).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// POST endpoint to dispatch functional recruiter reminders
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'COMPANY' && session.user.role !== 'TPO')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, message, roleTitle, companyName } = body;

    const newReminder: RecruiterReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: studentId || 'ALL',
      companyName: companyName || session.user.name || 'Recruiter',
      role: roleTitle || 'Placement Drive',
      message: message || 'Reminder: Please complete your interview or respond to the offer.',
      createdAt: new Date().toISOString(),
      unread: true
    };

    if (!global.globalReminders) {
      global.globalReminders = [];
    }
    global.globalReminders.unshift(newReminder);

    return NextResponse.json({ success: true, reminder: newReminder });
  } catch (error: any) {
    console.error('Error posting reminder:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch reminder' }, { status: 500 });
  }
}

// DELETE endpoint to delete single or all notifications (Issue 4)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = session.user.id || session.user.userId || 'user';

    if (!global.dismissedNotificationIds) {
      global.dismissedNotificationIds = new Set<string>();
    }

    if (id === 'all') {
      global.dismissedNotificationIds.add(`ALL-${userId}`);
      global.globalReminders = (global.globalReminders || []).filter(
        r => r.studentId !== session.user.profileId && r.studentId !== 'ALL'
      );
    } else if (id) {
      global.dismissedNotificationIds.add(id);
      global.dismissedNotificationIds.add(`${userId}-${id}`);
      global.globalReminders = (global.globalReminders || []).filter(r => r.id !== id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete notification' }, { status: 500 });
  }
}
