import "reflect-metadata";
import { AppDataSource } from "@/lib/db/data-source";
import { seedDatabase } from "@/lib/db/seed";

async function runSeed() {
  await AppDataSource.initialize();
  try {
    await seedDatabase(AppDataSource);
    console.log("Seed data inserted.");
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
