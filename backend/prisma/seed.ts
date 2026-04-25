import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = "admin@integra360.local";
  const passwordHash = await bcrypt.hash("Admin123456!", 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
