import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const existing = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
  if (!existing) {
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@gmail.com',
        password,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('Created Super Admin:', superAdmin.email);
  } else {
    console.log('Super Admin already exists:', existing.email);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
