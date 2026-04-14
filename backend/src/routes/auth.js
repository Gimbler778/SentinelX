import { Router } from 'express';
import passport from 'passport';
import { authenticate, generateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Initiate Google OAuth flow
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    try {
      const token = generateToken(req.user.id);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // Redirect to frontend with token in query param (frontend stores in localStorage)
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    } catch (err) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=token_failed`);
    }
  }
);

// ── Session ───────────────────────────────────────────────────────────────────

// Get current user
router.get('/me', authenticate, (req, res) => {
  const { id, email, name, role, avatar, last_login, created_at } = req.user;
  res.json({
    user: { id, email, name, role, avatar, lastLogin: last_login, createdAt: created_at }
  });
});

// Logout (client should delete token; this is for server-side audit)
router.post('/logout', authenticate, async (req, res) => {
  try {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [req.user.id]);
    res.json({ message: 'Logged out successfully' });
  } catch (_) {
    res.json({ message: 'Logged out' });
  }
});

// Update profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, avatarStyle, avatarSeed, avatar } = req.body;
    const { rows } = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           avatar_style = COALESCE($2, avatar_style),
           avatar_seed = COALESCE($3, avatar_seed),
           avatar = COALESCE($4, avatar),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, name, role, avatar, avatar_style, avatar_seed`,
      [name, avatarStyle, avatarSeed, avatar, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
