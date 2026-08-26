import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes from "./routes/auth";
import emailRoutes from "./routes/emails";
import { startWorker } from "./queue/emailWorker";

const app = express();
const PORT = parseInt(process.env.PORT ?? "5000", 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // allow session cookies
  })
);

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Sessions ────────────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "fallback-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌐  ReachInbox API running at http://localhost:${PORT}`);
  console.log(`📋  Auth:   http://localhost:${PORT}/api/auth/google`);
  console.log(`📋  Health: http://localhost:${PORT}/health\n`);
});

// Start BullMQ worker in the same process (OK for development)
startWorker();

export default app;
