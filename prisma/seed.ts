import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.enrollment.deleteMany();
  await prisma.stageEntry.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.application.deleteMany();
  await prisma.trainingProgram.deleteMany();
  await prisma.drive.deleteMany();
  await prisma.student.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tPOAdmin.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const companyPassword = await bcrypt.hash('company123', saltRounds);
  const studentPassword = await bcrypt.hash('student123', saltRounds);

  // 1. TPO Admin
  console.log('Creating TPO Admin...');
  const tpoAdminUser = await prisma.user.create({
    data: {
      email: 'admin@ggsipu.ac.in',
      password: adminPassword,
      role: 'TPO',
    },
  });
  await prisma.tPOAdmin.create({
    data: {
      userId: tpoAdminUser.id,
      name: 'GGSIPU Admin',
    },
  });

  // 2. Companies
  console.log('Creating Companies...');
  const companiesData = [
    { email: 'hr@techcorp.io', name: 'TechCorp Innovations', tier: 'TIER_1', industry: 'Software Engineering', logo: 'TC' },
    { email: 'hr@microsoft.com', name: 'Microsoft India', tier: 'TIER_1', industry: 'Technology', logo: 'MS' },
    { email: 'hr@google.com', name: 'Google India', tier: 'TIER_1', industry: 'Technology', logo: 'G' },
    { email: 'hr@atlassian.com', name: 'Atlassian Corp', tier: 'TIER_1', industry: 'SaaS', logo: 'AT' },
    { email: 'hr@gfs.com', name: 'Global FinServ', tier: 'TIER_2', industry: 'Finance', logo: 'GF' },
    { email: 'hr@tcs.com', name: 'TCS Digital', tier: 'TIER_2', industry: 'IT Services', logo: 'TCS' },
    { email: 'hr@nexus.io', name: 'Nexus Systems', tier: 'TIER_1', industry: 'Cloud Computing', logo: 'NS' },
    { email: 'hr@amazon.com', name: 'Amazon India', tier: 'TIER_1', industry: 'E-Commerce / Cloud', logo: 'AMZ' },
  ];

  const companies: Record<string, string> = {};
  for (const c of companiesData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        password: companyPassword,
        role: 'COMPANY',
      },
    });
    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name: c.name,
        tier: c.tier,
        industry: c.industry,
        logo: c.logo,
      },
    });
    companies[c.name] = company.id;
  }

  // 3. Students
  console.log('Creating Students...');
  const studentsData = [
    { name: 'Rohan Mehta', email: 'rohan@ipu.ac.in', rollNo: '07114803121', branch: 'CSE', year: 4, cgpa: 8.7, backlogs: 0, class10: 91, class12: 88, graduationYear: 2024, placementStatus: 'PLACED', dreamEligible: true, resumeVerified: true, skills: ['React','Node.js','Python','SQL'] },
    { name: 'Priya Kapoor', email: 'priya.k@ipu.ac.in', rollNo: '07214803121', branch: 'IT', year: 4, cgpa: 7.8, backlogs: 0, class10: 86, class12: 82, graduationYear: 2024, placementStatus: 'UNPLACED', resumeVerified: true, skills: ['Java','Spring Boot','MySQL'] },
    { name: 'Amit Verma', email: 'amit.v@ipu.ac.in', rollNo: '07314803121', branch: 'ECE', year: 4, cgpa: 6.9, backlogs: 1, class10: 79, class12: 75, graduationYear: 2024, placementStatus: 'UNPLACED', resumeVerified: false, skills: ['Embedded C','MATLAB'] },
    { name: 'Sneha Gupta', email: 'sneha.g@ipu.ac.in', rollNo: '07414803121', branch: 'CSE', year: 4, cgpa: 9.2, backlogs: 0, class10: 96, class12: 94, graduationYear: 2024, placementStatus: 'PLACED', dreamEligible: true, resumeVerified: true, skills: ['Python','ML','TensorFlow'] },
    { name: 'Anjali Sharma', email: 'anjali.s@ipu.ac.in', rollNo: '07614803121', branch: 'IT', year: 4, cgpa: 8.3, backlogs: 0, class10: 89, class12: 85, graduationYear: 2024, placementStatus: 'PLACED', dreamEligible: true, resumeVerified: true, skills: ['Angular','TypeScript','Node.js'] },
    { name: 'Aryan Patel', email: 'aryan.p@ipu.ac.in', rollNo: '07914803121', branch: 'CSE', year: 4, cgpa: 8.9, backlogs: 0, class10: 93, class12: 90, graduationYear: 2024, placementStatus: 'PLACED', dreamEligible: true, resumeVerified: true, skills: ['Flutter','Dart','Firebase'] },
    { name: 'Nikhil Rao', email: 'nikhil.r@ipu.ac.in', rollNo: '07714803121', branch: 'CSE', year: 4, cgpa: 7.5, backlogs: 0, class10: 85, class12: 81, graduationYear: 2024, placementStatus: 'UNPLACED', resumeVerified: true, skills: ['Go','Kubernetes','Docker'] },
    { name: 'Meera Nair', email: 'meera.n@ipu.ac.in', rollNo: '08014803121', branch: 'IT', year: 4, cgpa: 7.6, backlogs: 0, class10: 87, class12: 83, graduationYear: 2024, placementStatus: 'UNPLACED', resumeVerified: true, skills: ['Python','Django','PostgreSQL'] },
    { name: 'Karan Singh', email: 'karan.s@ipu.ac.in', rollNo: '07514803121', branch: 'ME', year: 4, cgpa: 7.2, backlogs: 0, class10: 83, class12: 80, graduationYear: 2024, placementStatus: 'UNPLACED', resumeVerified: true, skills: ['AutoCAD','SolidWorks'] },
    { name: 'Divya Jain', email: 'divya.j@ipu.ac.in', rollNo: '07814803121', branch: 'EEE', year: 4, cgpa: 6.4, backlogs: 2, class10: 74, class12: 71, graduationYear: 2024, placementStatus: 'UNPLACED', resumeVerified: false, skills: ['Power Systems','PLC'] },
  ];

  const students: Record<string, string> = {};
  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: studentPassword,
        role: 'STUDENT',
      },
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        name: s.name,
        rollNo: s.rollNo,
        branch: s.branch,
        year: s.year,
        cgpa: s.cgpa,
        backlogs: s.backlogs,
        class10: s.class10,
        class12: s.class12,
        graduationYear: s.graduationYear,
        placementStatus: s.placementStatus,
        dreamEligible: s.dreamEligible || false,
        resumeVerified: s.resumeVerified,
        skillsJson: JSON.stringify(s.skills),
      },
    });
    students[s.email.split('@')[0].split('.')[0]] = student.id; 
  }

  // 4. Drives
  console.log('Creating Drives...');
  const drivesData = [
    { companyId: companies['TechCorp Innovations'], role: 'Software Development Engineer', ctc: 12, location: 'Bangalore / Remote', mode: 'HYBRID', deadline: new Date('2024-10-24T00:00:00Z'), driveDate: new Date('2024-10-28T00:00:00Z'), status: 'ACTIVE', approvalStatus: 'APPROVED', jobType: 'FULL_TIME', rounds: ['Online Test','Technical Interview 1','Technical Interview 2','HR'], branches: ['CSE','IT','ECE'], gradYears: [2024], minCGPA: 7.5, maxBacklogs: 0, minClass10: 75, minClass12: 75, offerPolicy: 'STANDARD', description: 'SDE-1 role focused on backend engineering.' },
    { companyId: companies['Microsoft India'], role: 'Product Engineer', ctc: 18, location: 'Hyderabad', mode: 'ONSITE', deadline: new Date('2024-10-26T00:00:00Z'), driveDate: new Date('2024-11-02T00:00:00Z'), status: 'ACTIVE', approvalStatus: 'APPROVED', jobType: 'FULL_TIME', rounds: ['Coding Round','Design Interview','Behavioral'], branches: ['CSE','IT'], gradYears: [2024], minCGPA: 8.0, maxBacklogs: 0, minClass10: 80, minClass12: 80, offerPolicy: 'ONE_OFFER', description: 'Product engineering in Microsoft Azure division.' },
    { companyId: companies['Nexus Systems'], role: 'Cloud Architect', ctc: 22, location: 'Gurgaon', mode: 'ONSITE', deadline: new Date('2024-10-25T00:00:00Z'), driveDate: new Date('2024-10-30T00:00:00Z'), status: 'ACTIVE', approvalStatus: 'APPROVED', jobType: 'FULL_TIME', rounds: ['Aptitude','Technical','Case Study','HR'], branches: ['CSE','IT','ECE','EEE'], gradYears: [2024], minCGPA: 7.0, maxBacklogs: 0, minClass10: 70, minClass12: 70, offerPolicy: 'STANDARD', description: 'Cloud infrastructure & architecture.' },
    { companyId: companies['Global FinServ'], role: 'Data Analyst', ctc: 8.5, location: 'Gurgaon', mode: 'ONSITE', deadline: new Date('2024-10-26T00:00:00Z'), driveDate: new Date('2024-11-04T00:00:00Z'), status: 'UPCOMING', approvalStatus: 'APPROVED', jobType: 'FULL_TIME', rounds: ['Aptitude','SQL Test','HR'], branches: ['CSE','IT','ECE'], gradYears: [2024], minCGPA: 8.0, maxBacklogs: 0, minClass10: 80, minClass12: 80, offerPolicy: 'STANDARD', description: 'Financial quantitative & predictive modeling.' },
    { companyId: companies['TCS Digital'], role: 'System Engineer', ctc: 7, location: 'Pan India', mode: 'ONSITE', deadline: new Date('2024-11-05T00:00:00Z'), driveDate: new Date('2024-11-10T00:00:00Z'), status: 'UPCOMING', approvalStatus: 'APPROVED', jobType: 'FULL_TIME', rounds: ['NQT','Technical','HR'], branches: ['CSE','IT','ECE','EEE','ME'], gradYears: [2024], minCGPA: 6.0, maxBacklogs: 2, minClass10: 60, minClass12: 60, offerPolicy: 'STANDARD', description: 'Core system engineering and software operations.' },
    { companyId: companies['Atlassian Corp'], role: 'Senior Software Engineer', ctc: 52, location: 'Sydney / Remote', mode: 'REMOTE', deadline: new Date('2024-11-10T00:00:00Z'), driveDate: new Date('2024-11-15T00:00:00Z'), status: 'UPCOMING', approvalStatus: 'APPROVED', jobType: 'FULL_TIME', rounds: ['Take-Home','System Design','Pair Programming','HR'], branches: ['CSE','IT'], gradYears: [2024], minCGPA: 9.0, maxBacklogs: 0, minClass10: 85, minClass12: 85, offerPolicy: 'DREAM_OFFER', description: 'Tier-1 Dream Offer drive for high-scale collaboration platform.' },
    { companyId: companies['Amazon India'], role: 'SDE-1 (AWS)', ctc: 26, location: 'Bangalore', mode: 'HYBRID', deadline: new Date('2024-11-20T00:00:00Z'), driveDate: new Date('2024-11-25T00:00:00Z'), status: 'UPCOMING', approvalStatus: 'PENDING', jobType: 'FULL_TIME', rounds: ['OA','Technical x3','Bar Raiser','HR'], branches: ['CSE','IT'], gradYears: [2024], minCGPA: 7.5, maxBacklogs: 0, minClass10: 75, minClass12: 75, offerPolicy: 'ONE_OFFER', description: 'AWS distributed systems & cloud microservices.' },
  ];

  const drives: Record<string, string> = {};
  for (const d of drivesData) {
    const drive = await prisma.drive.create({
      data: {
        companyId: d.companyId,
        role: d.role,
        ctc: d.ctc,
        location: d.location,
        mode: d.mode,
        deadline: d.deadline,
        driveDate: d.driveDate,
        status: d.status,
        approvalStatus: d.approvalStatus,
        jobType: d.jobType,
        roundsJson: JSON.stringify(d.rounds),
        branchesJson: JSON.stringify(d.branches),
        gradYearsJson: JSON.stringify(d.gradYears),
        minCGPA: d.minCGPA,
        maxBacklogs: d.maxBacklogs,
        minClass10: d.minClass10,
        minClass12: d.minClass12,
        offerPolicy: d.offerPolicy,
        description: d.description,
      },
    });
    const companyName = Object.keys(companies).find(k => companies[k] === d.companyId);
    if (companyName) {
      drives[companyName] = drive.id;
    }
  }

  // 5. Applications & StageEntries & Offers
  console.log('Creating Applications, Stages, and Offers...');
  const applicationsData = [
    { student: 'rohan', company: 'TechCorp Innovations', status: 'SHORTLISTED', stages: [{ stage: 'Applied', date: new Date('2024-10-15T00:00:00Z') }, { stage: 'Shortlisted', date: new Date('2024-10-18T00:00:00Z'), note: 'Selected for technical rounds' }] },
    { student: 'rohan', company: 'Microsoft India', status: 'INTERVIEW_SCHEDULED', stages: [{ stage: 'Applied', date: new Date('2024-10-16T00:00:00Z') }, { stage: 'Shortlisted', date: new Date('2024-10-19T00:00:00Z') }, { stage: 'Interview Scheduled', date: new Date('2024-10-22T00:00:00Z'), note: 'Technical Round 1 on Nov 2nd' }] },
    { student: 'rohan', company: 'Nexus Systems', status: 'OFFER_EXTENDED', offer: { ctc: 22 }, stages: [{ stage: 'Applied', date: new Date('2024-10-10T00:00:00Z') }, { stage: 'Shortlisted', date: new Date('2024-10-14T00:00:00Z') }, { stage: 'Interview Scheduled', date: new Date('2024-10-20T00:00:00Z') }, { stage: 'Offer Extended', date: new Date('2024-10-23T00:00:00Z') }] },
    { student: 'sneha', company: 'TechCorp Innovations', status: 'OFFER_ACCEPTED', offer: { ctc: 12, accepted: true }, stages: [{ stage: 'Applied', date: new Date('2024-10-14T00:00:00Z') }, { stage: 'Shortlisted', date: new Date('2024-10-18T00:00:00Z') }, { stage: 'Offer Extended', date: new Date('2024-10-22T00:00:00Z') }, { stage: 'Offer Accepted', date: new Date('2024-10-23T00:00:00Z') }] },
    { student: 'anjali', company: 'Nexus Systems', status: 'OFFER_ACCEPTED', offer: { ctc: 22, accepted: true }, stages: [{ stage: 'Applied', date: new Date('2024-10-11T00:00:00Z') }, { stage: 'Offer Extended', date: new Date('2024-10-21T00:00:00Z') }, { stage: 'Offer Accepted', date: new Date('2024-10-22T00:00:00Z') }] },
    { student: 'aryan', company: 'Atlassian Corp', status: 'OFFER_EXTENDED', offer: { ctc: 52 }, stages: [{ stage: 'Applied', date: new Date('2024-10-01T00:00:00Z') }, { stage: 'Offer Extended', date: new Date('2024-10-23T00:00:00Z') }] },
    { student: 'priya', company: 'Global FinServ', status: 'APPLIED', stages: [{ stage: 'Applied', date: new Date('2024-10-15T00:00:00Z') }] },
    { student: 'priya', company: 'Microsoft India', status: 'REJECTED', stages: [{ stage: 'Applied', date: new Date('2024-10-16T00:00:00Z') }, { stage: 'Rejected', date: new Date('2024-10-20T00:00:00Z'), note: 'Did not clear coding round' }] },
  ];

  for (const app of applicationsData) {
    const studentId = students[app.student];
    const driveId = drives[app.company];
    if (!studentId || !driveId) continue;

    const application = await prisma.application.create({
      data: {
        studentId,
        driveId,
        status: app.status,
      },
    });

    for (const st of app.stages as Array<{ stage: string; date: Date; note?: string }>) {
      await prisma.stageEntry.create({
        data: {
          applicationId: application.id,
          stage: st.stage,
          date: st.date,
          note: st.note || null,
        },
      });
    }

    if (app.offer) {
      await prisma.offer.create({
        data: {
          studentId,
          driveId,
          ctc: app.offer.ctc,
          status: app.offer.accepted ? 'ACCEPTED' : 'PENDING',
        },
      });
    }
  }

  // 6. TrainingPrograms
  console.log('Creating Training Programs...');
  const trainingsData = [
    { title: 'Advanced Java Certification Prep', type: 'TECHNICAL', date: new Date('2024-10-15T10:00:00Z'), time: '10:00 AM', venue: 'Seminar Hall A', mode: 'OFFLINE', capacity: 150, facilitator: 'Dr. Ramesh Kumar', tags: ['Java','Spring','Certification'] },
    { title: 'Quantitative Aptitude Workshop', type: 'APTITUDE', date: new Date('2024-10-18T14:00:00Z'), time: '02:00 PM', venue: 'Block B, Lab 3', mode: 'OFFLINE', capacity: 400, facilitator: 'Prof. Anita Mathur', tags: ['Aptitude','Quant','Verbal'] },
    { title: 'Corporate Communication Basics', type: 'SOFT_SKILLS', date: new Date('2024-10-20T11:30:00Z'), time: '11:30 AM', venue: 'Online (Zoom)', mode: 'ONLINE', capacity: 250, facilitator: 'Ms. Shweta Agarwal', tags: ['Communication','GD','HR'] },
    { title: 'AWS Cloud Practitioner Bootcamp', type: 'CERTIFICATION', date: new Date('2024-11-01T09:00:00Z'), time: '09:00 AM', venue: 'Computer Lab 2', mode: 'HYBRID', capacity: 100, facilitator: 'Mr. Suresh Pillai', tags: ['AWS','Cloud','DevOps'] },
    { title: 'System Design Masterclass', type: 'TECHNICAL', date: new Date('2024-11-05T15:00:00Z'), time: '03:00 PM', venue: 'Seminar Hall B', mode: 'ONLINE', capacity: 200, facilitator: 'Mr. Vikram Batra (Ex-Google)', tags: ['System Design','Architecture'] },
    { title: 'Mock Interview Series - Round 1', type: 'SOFT_SKILLS', date: new Date('2024-11-08T10:00:00Z'), time: '10:00 AM', venue: 'Placement Cell', mode: 'OFFLINE', capacity: 100, facilitator: 'TPO Staff', tags: ['Mock','Interview','HR'] },
  ];

  const trainings = [];
  for (const t of trainingsData) {
    const training = await prisma.trainingProgram.create({
      data: {
        title: t.title,
        type: t.type,
        date: t.date,
        time: t.time,
        venue: t.venue,
        mode: t.mode,
        capacity: t.capacity,
        facilitator: t.facilitator,
        tagsJson: JSON.stringify(t.tags),
      },
    });
    trainings.push(training);
  }

  // 7. Enrollments
  console.log('Creating Enrollments...');
  const enrollmentsData = [
    { student: 'rohan', programIndex: 0, attended: true },
    { student: 'rohan', programIndex: 1, attended: true },
    { student: 'rohan', programIndex: 2, attended: false },
    { student: 'priya', programIndex: 1, attended: true },
    { student: 'priya', programIndex: 2, attended: true },
    { student: 'sneha', programIndex: 0, attended: true },
    { student: 'sneha', programIndex: 3, attended: null },
  ];

  for (const e of enrollmentsData) {
    const studentId = students[e.student];
    const program = trainings[e.programIndex];
    if (!studentId || !program) continue;

    await prisma.enrollment.create({
      data: {
        studentId,
        trainingProgramId: program.id,
        attended: e.attended,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
