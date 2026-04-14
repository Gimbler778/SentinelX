# 🔐 Google OAuth Setup for SentinelX

## Step 1 — Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click **"New Project"** → name it `sentinelx`
3. Select the project

## Step 2 — Enable Google OAuth API

1. Go to **APIs & Services → Library**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click **Enable**

## Step 3 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials" → "OAuth 2.0 Client IDs"**
3. Application type: **Web application**
4. Name: `SentinelX`
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/auth/google/callback
   ```
   For production, also add:
   ```
   https://yourdomain.com/auth/google/callback
   ```
6. Click **Create**
7. Copy your **Client ID** and **Client Secret**

## Step 4 — Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. User Type: **External** (or Internal for G Suite)
3. App name: `SentinelX`
4. Add your email as test user
5. Save

## Step 5 — Add to .env

```bash
# backend/.env
GOOGLE_CLIENT_ID=1234567890-abc123xyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Also set these:
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

## Step 6 — Test

```bash
# Start the app
docker-compose up -d

# Visit
open http://localhost:5173
# Click "Continue with Google"
# You'll be redirected to Google login, then back to the dashboard
```

## How the Flow Works

```
Browser → /auth/google → Google Login → /auth/google/callback
       → JWT generated → Redirect to /dashboard?token=<jwt>
       → Frontend stores token in localStorage
       → All API requests use: Authorization: Bearer <jwt>
```

## Troubleshooting

**"redirect_uri_mismatch"** — The callback URL in Google Console must exactly match `GOOGLE_CALLBACK_URL` in .env.

**"Access blocked"** — Add your Google account as a test user in OAuth consent screen.

**Token not persisting** — Check `localStorage.getItem('sentinelx_token')` in browser console.
