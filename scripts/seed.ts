import fs from "fs";
import path from "path";

// Load .env.local or .env before importing database client
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envLocalPath);
  }
} else if (fs.existsSync(envPath)) {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  }
}

async function main() {
  console.log("Seeding LEVEL UP database...");
  console.log("Database target:", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ":***@") || "default");
  try {
    const { seedDatabase } = await import("../src/lib/db/seed");
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

