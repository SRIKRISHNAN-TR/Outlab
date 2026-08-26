import "dotenv/config";
import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

db.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});
