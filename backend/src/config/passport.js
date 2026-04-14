import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

export function initPassport() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    scope: ['profile', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const googleId = profile.id;
      const avatar = profile.photos?.[0]?.value;

      if (!email) return done(new Error('No email from Google profile'));

      // Upsert user
      const { rows } = await query(
        `INSERT INTO users (google_id, email, name, avatar, role, last_login)
         VALUES ($1, $2, $3, $4, 'analyst', NOW())
         ON CONFLICT (google_id) DO UPDATE
           SET name = EXCLUDED.name,
               avatar = EXCLUDED.avatar,
               last_login = NOW()
         RETURNING *`,
        [googleId, email, name, avatar]
      );
      return done(null, rows[0]);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, rows[0] || null);
    } catch (err) {
      done(err);
    }
  });
}
