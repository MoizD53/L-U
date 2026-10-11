import { seedDatabase } from "../src/lib/db/seed";

async function main() {
  console.log("Seeding LEVEL UP database...");
  try {
    await seedDatabase();
    console.log("Database seeded successfully!");
    console.log("Default Accounts:");
    console.log("  Owner:   username: 'owner', password: 'admin123'");
    console.log("  Manager: username: 'manager', password: 'manager123'");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

main();
