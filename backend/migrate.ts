import "dotenv/config";
import { db } from "./src/db";

async function run() {
  await db.query(`ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS preview_url TEXT`);
  console.log("✅  preview_url column added (or already exists)");
  await db.end();
}
run().catch((e) => { console.error(e); process.exit(1); });
