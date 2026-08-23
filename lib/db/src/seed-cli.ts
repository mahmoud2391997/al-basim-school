import { seedDatabase } from "./seed";

seedDatabase()
  .then((seeded) => {
    console.log(seeded ? "Database seeded successfully." : "Database already has data — skipped seed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
