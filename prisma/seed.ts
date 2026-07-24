import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedBoardDefaultsForUser } from "../lib/board-defaults";

const prisma = new PrismaClient();

async function main() {
  // ---- App settings ----
  await prisma.appSetting.upsert({
    where: { key: "accentColor" },
    update: {},
    create: { key: "accentColor", value: "#2563eb" },
  });

  // ---- Founder account ----
  const username = (process.env.SEED_FOUNDER_USERNAME ?? "founder").toLowerCase().trim();
  const password = process.env.SEED_FOUNDER_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SEED_FOUNDER_NAME ?? "Founder";
  const passwordHash = await bcrypt.hash(password, 10);

  const founder = await prisma.user.upsert({
    where: { username },
    update: { role: "FOUNDER", active: true },
    create: { username, name, passwordHash, role: "FOUNDER" },
  });
  console.log(`Founder ready → username: ${username}`);

  // ---- Founder's starting board (statuses & categories) ----
  await seedBoardDefaultsForUser(prisma, founder.id);

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
