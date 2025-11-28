# Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Local Firebase configuration for Vite (untracked)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

NEON_DATABASE_URL=

AUTH_JWT_SECRET=

VITE_HF_SPACE_URL=

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





