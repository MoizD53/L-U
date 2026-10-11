import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envLocalPath);
}

async function main() {
  console.log("Setting up unified user levelup@dahod...");
  const { db } = await import("../src/lib/db/client");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("levelup@123", salt);
  const now = new Date().toISOString();
  const businessId = "biz_levelup_dahod";

  // Check if levelup@dahod exists
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE LOWER(username) = ?",
    args: ["levelup@dahod"],
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (id, business_id, username, password_hash, name, role, phone, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'OWNER', ?, 1, ?, ?)`,
      args: [
        "usr_levelup_dahod",
        businessId,
        "levelup@dahod",
        passwordHash,
        "Level Up Dahod",
        "+91 98765 43210",
        now,
        now,
      ],
    });
    console.log("Created user: levelup@dahod with password levelup@123 (Role: OWNER / Full Access)");
  } else {
    await db.execute({
      sql: `UPDATE users SET password_hash = ?, role = 'OWNER', is_active = 1, updated_at = ?
            WHERE LOWER(username) = ?`,
      args: [passwordHash, now, "levelup@dahod"],
    });
    console.log("Updated user: levelup@dahod with password levelup@123");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating user:", err);
  process.exit(1);
});
