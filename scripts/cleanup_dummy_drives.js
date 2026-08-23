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
const prisma = new PrismaClient();

async function clean() {
  const dummyDrives = await prisma.drive.findMany({
    where: {
      OR: [
        { role: { contains: 'Peon', mode: 'insensitive' } },
        { company: { name: { contains: 'yadav', mode: 'insensitive' } } }
      ]
    },
    select: { id: true }
  });

  const dummyDriveIds = dummyDrives.map(d => d.id);

  if (dummyDriveIds.length > 0) {
    const dummyApps = await prisma.application.findMany({
      where: { driveId: { in: dummyDriveIds } },
      select: { id: true }
    });
    const dummyAppIds = dummyApps.map(a => a.id);

    if (dummyAppIds.length > 0) {
      await prisma.stageEntry.deleteMany({ where: { applicationId: { in: dummyAppIds } } });
      await prisma.application.deleteMany({ where: { id: { in: dummyAppIds } } });
    }

    await prisma.offer.deleteMany({ where: { driveId: { in: dummyDriveIds } } });
    const deleted = await prisma.drive.deleteMany({ where: { id: { in: dummyDriveIds } } });
    console.log(`Successfully deleted ${deleted.count} dummy test drives!`);
  } else {
    console.log('No dummy test drives found.');
  }
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
