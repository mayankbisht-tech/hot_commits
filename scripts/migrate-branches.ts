import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating legacy branch names to AI-DS, AI-ML, AR, IIOT...');

  const cseUpdated = await prisma.student.updateMany({
    where: { branch: 'CSE' },
    data: { branch: 'AI-DS' }
  });
  console.log(`Updated CSE -> AI-DS: ${cseUpdated.count}`);

  const itUpdated = await prisma.student.updateMany({
    where: { branch: 'IT' },
    data: { branch: 'AI-ML' }
  });
  console.log(`Updated IT -> AI-ML: ${itUpdated.count}`);

  const eceUpdated = await prisma.student.updateMany({
    where: { branch: 'ECE' },
    data: { branch: 'AR' }
  });
  console.log(`Updated ECE -> AR: ${eceUpdated.count}`);

  const otherUpdated = await prisma.student.updateMany({
    where: { branch: { in: ['EEE', 'ME', 'CE'] } },
    data: { branch: 'IIOT' }
  });
  console.log(`Updated EEE/ME/CE -> IIOT: ${otherUpdated.count}`);

  const students = await prisma.student.findMany({ select: { name: true, branch: true } });
  console.log('Current Students in DB:', students);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
