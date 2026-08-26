import "dotenv/config";
import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db";

const router = Router();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// GET /api/auth/google — redirect to Google consent screen
router.get("/google", (_req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "select_account",
  });
  res.redirect(url);
});

// GET /api/auth/google/callback — handle Google redirect
router.get("/google/callback", async (req: Request, res: Response) => {
  const { code } = req.query as { code?: string };
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile
    const userInfoRes = await oauth2Client.request<{
      sub: string;
      name: string;
      email: string;
      picture?: string;
    }>({ url: "https://www.googleapis.com/oauth2/v3/userinfo" });

    const profile = userInfoRes.data;

    // Upsert user in database
    const result = await db.query(
      `INSERT INTO users (google_id, name, email, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE
         SET name = EXCLUDED.name,
             email = EXCLUDED.email,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = now()
       RETURNING id, google_id, name, email, avatar_url`,
      [profile.sub, profile.name, profile.email, profile.picture ?? null]
    );

    const user = result.rows[0];

    // Store in session
    (req.session as any).userId = user.id;
    (req.session as any).user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
    };

    res.redirect(`${frontendUrl}/dashboard`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// GET /api/auth/me — return current logged-in user
router.get("/me", (req: Request, res: Response) => {
  const user = (req.session as any).user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(user);
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

export default router;
