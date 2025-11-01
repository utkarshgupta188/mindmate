# Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Local Firebase configuration for Vite (untracked)
VITE_FIREBASE_API_KEY=AIzaSyCH9-4pASKxCUwW7Lr7k0F7hJfppWO7rXU
VITE_FIREBASE_AUTH_DOMAIN=mindmate-5f71d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mindmate-5f71d
VITE_FIREBASE_STORAGE_BUCKET=mindmate-5f71d.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=772277162051
VITE_FIREBASE_APP_ID=1:772277162051:web:bbca7127ecbc3d7c5584f6
VITE_FIREBASE_MEASUREMENT_ID=G-54E6LBGTBG

NEON_DATABASE_URL=postgresql://neondb_owner:npg_LSgf7hWNsu2T@ep-nameless-leaf-ah7jia8c-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

AUTH_JWT_SECRET=A4GSOkukSFG7wGZ5QjPcD+J1xZwOXm64fgn2gqmcMdD1ESnMzPNjfJlyzP9/XkIw

VITE_HF_SPACE_URL=https://unknownhackerr-mental-health-beta16.hf.space

VITE_ALLOW_DEMO_AUTH=false

# Gemini API Key (optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## For Vercel Deployment

Add these environment variables in your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable from above
3. Make sure to select all environments (Production, Preview, Development)

**Note:** The `.env.local` file is already in `.gitignore`, so your secrets won't be committed.





