const fs = require('fs');
const path = require('path');

try {
  const envConfig = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2 && !line.trim().startsWith('#')) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  });
} catch {}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTwentyJobs() {
  console.log('Seeding 20+ Tier-1 & Tier-2 Placement Drives...');

  const passwordHash = await bcrypt.hash('company123', 10);

  const jobsData = [
    {
      companyName: 'Google India',
      email: 'hr@google.com',
      tier: 'TIER_1',
      industry: 'Artificial Intelligence & Search',
      logo: 'G',
      role: 'Software Engineer - AI & Cloud',
      ctc: 38.5,
      location: 'Bangalore / Hyderabad',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 8.0,
      maxBacklogs: 0,
      minClass10: 80,
      minClass12: 80,
      offerPolicy: 'DREAM_OFFER',
      description: 'Design and scale machine learning pipelines, distributed search services, and Cloud AI infrastructure.'
    },
    {
      companyName: 'Microsoft India',
      email: 'hr@microsoft.com',
      tier: 'TIER_1',
      industry: 'Enterprise Software & Cloud',
      logo: 'MS',
      role: 'Product Engineer (Azure & AI)',
      ctc: 28.0,
      location: 'Hyderabad',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'ONE_OFFER',
      description: 'Build hyper-scale cloud microservices, Azure Kubernetes features, and AI copilot platform extensions.'
    },
    {
      companyName: 'Amazon India',
      email: 'hr@amazon.com',
      tier: 'TIER_1',
      industry: 'E-Commerce & AWS Cloud',
      logo: 'AMZ',
      role: 'SDE-1 (AWS Cloud Infrastructure)',
      ctc: 26.5,
      location: 'Bangalore',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'ONE_OFFER',
      description: 'AWS distributed systems engineering, high-throughput microservices, and storage engine development.'
    },
    {
      companyName: 'Meta (Facebook)',
      email: 'hr@meta.com',
      tier: 'TIER_1',
      industry: 'Social Infrastructure & AI',
      logo: 'META',
      role: 'Full Stack Product Engineer',
      ctc: 45.0,
      location: 'Gurgaon / Remote',
      mode: 'REMOTE',
      jobType: 'FULL_TIME',
      minCGPA: 8.5,
      maxBacklogs: 0,
      minClass10: 85,
      minClass12: 85,
      offerPolicy: 'DREAM_OFFER',
      description: 'Engineering global scale React, GraphQL, Python, and PyTorch AI messaging services for billions of users.'
    },
    {
      companyName: 'Apple India',
      email: 'hr@apple.com',
      tier: 'TIER_1',
      industry: 'Consumer Technology & OS',
      logo: 'AAPL',
      role: 'iOS & Core Systems Engineer',
      ctc: 34.0,
      location: 'Hyderabad',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 8.0,
      maxBacklogs: 0,
      minClass10: 80,
      minClass12: 80,
      offerPolicy: 'DREAM_OFFER',
      description: 'Swift, C++, low-level operating system performance optimization, and hardware integration.'
    },
    {
      companyName: 'Netflix',
      email: 'hr@netflix.com',
      tier: 'TIER_1',
      industry: 'Streaming Media & Edge',
      logo: 'NFLX',
      role: 'Backend Systems & Streaming Engineer',
      ctc: 48.0,
      location: 'Mumbai / Remote',
      mode: 'REMOTE',
      jobType: 'FULL_TIME',
      minCGPA: 8.5,
      maxBacklogs: 0,
      minClass10: 85,
      minClass12: 85,
      offerPolicy: 'DREAM_OFFER',
      description: 'High-concurrency streaming infrastructure, Java microservices, Redis caching, and edge delivery networks.'
    },
    {
      companyName: 'Uber',
      email: 'hr@uber.com',
      tier: 'TIER_1',
      industry: 'Mobility & Distributed Logistics',
      logo: 'UBER',
      role: 'Mobile & Platform Systems Engineer',
      ctc: 32.0,
      location: 'Bangalore',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'ONE_OFFER',
      description: 'Real-time geo-spatial algorithms, Go backend services, and high-reliability ride matching systems.'
    },
    {
      companyName: 'Stripe',
      email: 'hr@stripe.com',
      tier: 'TIER_1',
      industry: 'Fintech Payments Infrastructure',
      logo: 'STRP',
      role: 'Infrastructure & Payment Engineer',
      ctc: 42.0,
      location: 'Remote',
      mode: 'REMOTE',
      jobType: 'FULL_TIME',
      minCGPA: 8.0,
      maxBacklogs: 0,
      minClass10: 80,
      minClass12: 80,
      offerPolicy: 'DREAM_OFFER',
      description: 'Mission-critical financial infrastructure handling global payment processing and ledger databases.'
    },
    {
      companyName: 'Atlassian Corp',
      email: 'hr@atlassian.com',
      tier: 'TIER_1',
      industry: 'SaaS Collaboration Platforms',
      logo: 'AT',
      role: 'Senior Software Engineer (Cloud)',
      ctc: 52.0,
      location: 'Sydney / Remote',
      mode: 'REMOTE',
      jobType: 'FULL_TIME',
      minCGPA: 9.0,
      maxBacklogs: 0,
      minClass10: 85,
      minClass12: 85,
      offerPolicy: 'DREAM_OFFER',
      description: 'Tier-1 Dream Offer drive for high-scale enterprise SaaS platforms (Jira, Confluence, Bitbucket).'
    },
    {
      companyName: 'Adobe',
      email: 'hr@adobe.com',
      tier: 'TIER_1',
      industry: 'Digital Media & AI Graphics',
      logo: 'ADBE',
      role: 'Computer Vision & AI Researcher',
      ctc: 30.0,
      location: 'Noida / Gurgaon',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.8,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'ONE_OFFER',
      description: 'Generative AI models, PyTorch computer vision algorithms, and Firefly media engine integration.'
    },
    {
      companyName: 'Salesforce',
      email: 'hr@salesforce.com',
      tier: 'TIER_1',
      industry: 'Enterprise CRM Cloud',
      logo: 'CRM',
      role: 'Cloud Application Developer',
      ctc: 24.0,
      location: 'Hyderabad',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'STANDARD',
      description: 'Building multi-tenant enterprise applications, REST APIs, and Lightning Web Components.'
    },
    {
      companyName: 'Goldman Sachs',
      email: 'hr@goldmansachs.com',
      tier: 'TIER_1',
      industry: 'Investment Banking & Quant Tech',
      logo: 'GS',
      role: 'Quant & Financial Software Developer',
      ctc: 25.0,
      location: 'Bangalore',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 8.0,
      maxBacklogs: 0,
      minClass10: 80,
      minClass12: 80,
      offerPolicy: 'ONE_OFFER',
      description: 'Algorithmic trading software, risk management engines, and high-frequency C++/Python data pipelines.'
    },
    {
      companyName: 'Morgan Stanley',
      email: 'hr@morganstanley.com',
      tier: 'TIER_1',
      industry: 'Financial Data & Analytics',
      logo: 'MS',
      role: 'Financial Data Engineer',
      ctc: 21.0,
      location: 'Mumbai',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'STANDARD',
      description: 'Large-scale financial data processing, PySpark ETL pipelines, SQL databases, and risk dashboards.'
    },
    {
      companyName: 'JPMorgan Chase',
      email: 'hr@jpmorgan.com',
      tier: 'TIER_1',
      industry: 'Banking & Financial Technology',
      logo: 'JPMC',
      role: 'Software Engineer - Global Tech',
      ctc: 19.5,
      location: 'Bangalore / Hyderabad',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.0,
      maxBacklogs: 0,
      minClass10: 70,
      minClass12: 70,
      offerPolicy: 'STANDARD',
      description: 'Java Spring Boot microservices, security protocols, PostgreSQL databases, and transaction processing.'
    },
    {
      companyName: 'Flipkart',
      email: 'hr@flipkart.com',
      tier: 'TIER_1',
      industry: 'E-Commerce Platform',
      logo: 'FK',
      role: 'SDE-1 (Supply Chain & Search)',
      ctc: 22.0,
      location: 'Bangalore',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'STANDARD',
      description: 'High scale e-commerce search algorithms, inventory microservices, Redis caching, and Kafka event queues.'
    },
    {
      companyName: 'Zomato',
      email: 'hr@zomato.com',
      tier: 'TIER_1',
      industry: 'Consumer Tech & Food Delivery',
      logo: 'ZMT',
      role: 'Backend Systems Developer',
      ctc: 18.0,
      location: 'Gurgaon',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.0,
      maxBacklogs: 0,
      minClass10: 70,
      minClass12: 70,
      offerPolicy: 'STANDARD',
      description: 'Python & Go backend services, location routing algorithms, MySQL, and real-time order tracking.'
    },
    {
      companyName: 'Swiggy',
      email: 'hr@swiggy.com',
      tier: 'TIER_1',
      industry: 'Hyperlocal Delivery Tech',
      logo: 'SWG',
      role: 'Data Scientist & AI Engineer',
      ctc: 20.0,
      location: 'Bangalore',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'STANDARD',
      description: 'Demand forecasting machine learning models, delivery optimization, Python, Scikit-Learn, and SQL.'
    },
    {
      companyName: 'Paytm',
      email: 'hr@paytm.com',
      tier: 'TIER_2',
      industry: 'Payments & Digital Banking',
      logo: 'PAYTM',
      role: 'Fintech Systems Engineer',
      ctc: 16.0,
      location: 'Noida',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.0,
      maxBacklogs: 0,
      minClass10: 70,
      minClass12: 70,
      offerPolicy: 'STANDARD',
      description: 'Payment gateway API development, Java Spring, fraud detection, and PostgreSQL databases.'
    },
    {
      companyName: 'TechCorp Innovations',
      email: 'hr@techcorp.io',
      tier: 'TIER_2',
      industry: 'Software Engineering',
      logo: 'TC',
      role: 'Software Development Engineer',
      ctc: 12.0,
      location: 'Bangalore / Remote',
      mode: 'HYBRID',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'STANDARD',
      description: 'Full stack web development using React, Node.js, Python, and SQL databases.'
    },
    {
      companyName: 'Nexus Systems',
      email: 'hr@nexus.io',
      tier: 'TIER_1',
      industry: 'Cloud Computing & DevOps',
      logo: 'NS',
      role: 'Cloud Architect & DevOps Engineer',
      ctc: 22.0,
      location: 'Gurgaon',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.0,
      maxBacklogs: 0,
      minClass10: 70,
      minClass12: 70,
      offerPolicy: 'STANDARD',
      description: 'AWS cloud infrastructure deployment, Terraform scripts, Docker containers, and Kubernetes management.'
    },
    {
      companyName: 'Global FinServ',
      email: 'hr@gfs.com',
      tier: 'TIER_2',
      industry: 'Financial Quantitative Analytics',
      logo: 'GF',
      role: 'Quantitative Data Analyst',
      ctc: 8.5,
      location: 'Gurgaon',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 7.5,
      maxBacklogs: 0,
      minClass10: 75,
      minClass12: 75,
      offerPolicy: 'STANDARD',
      description: 'Financial quantitative analytics, Python scripting, SQL database querying, and BI dashboards.'
    },
    {
      companyName: 'TCS Digital',
      email: 'hr@tcs.com',
      tier: 'TIER_2',
      industry: 'IT Services & Digital Solutions',
      logo: 'TCS',
      role: 'Digital Systems Engineer',
      ctc: 7.5,
      location: 'Pan India',
      mode: 'ONSITE',
      jobType: 'FULL_TIME',
      minCGPA: 6.0,
      maxBacklogs: 2,
      minClass10: 60,
      minClass12: 60,
      offerPolicy: 'STANDARD',
      description: 'Enterprise digital engineering, Java, C++, SQL databases, and IT systems integration.'
    }
  ];

  for (const job of jobsData) {
    // 1. Ensure User Identity
    let user = await prisma.user.findUnique({ where: { email: job.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: job.email,
          password: passwordHash,
          role: 'COMPANY'
        }
      });
    }

    // 2. Ensure Company Profile
    let company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          userId: user.id,
          name: job.companyName,
          tier: job.tier,
          industry: job.industry,
          logo: job.logo
        }
      });
    } else {
      await prisma.company.update({
        where: { id: company.id },
        data: { tier: job.tier, industry: job.industry, logo: job.logo }
      });
    }

    // 3. Create or Update Placement Drive
    const existingDrive = await prisma.drive.findFirst({
      where: { companyId: company.id, role: job.role }
    });

    const driveDataPayload = {
      companyId: company.id,
      role: job.role,
      ctc: job.ctc,
      location: job.location,
      mode: job.mode,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      jobType: job.jobType,
      roundsJson: JSON.stringify(['Coding Test', 'Technical Round 1', 'Technical Round 2', 'HR Interview']),
      branchesJson: JSON.stringify(['CSE', 'IT', 'AI-DS', 'ECE', 'EEE']),
      gradYearsJson: JSON.stringify([2024, 2025, 2026, 2027]),
      minCGPA: job.minCGPA,
      maxBacklogs: job.maxBacklogs,
      minClass10: job.minClass10,
      minClass12: job.minClass12,
      offerPolicy: job.offerPolicy,
      description: job.description
    };

    if (existingDrive) {
      await prisma.drive.update({
        where: { id: existingDrive.id },
        data: driveDataPayload
      });
    } else {
      await prisma.drive.create({
        data: driveDataPayload
      });
    }
  }

  console.log('Successfully seeded 22 Tier-1 and Tier-2 placement drives with complete JDs and tech stacks!');
}

seedTwentyJobs()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
