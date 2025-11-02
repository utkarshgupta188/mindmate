# MindMate — Nature Theme + Dark Mode

- Nature color system (forest/moss/mint) with subtle glass UI
- Dark mode via class strategy + system preference + toggle
- Framer Motion for gentle animations
- Lucide icons for the toggle
- All pages styled (Landing hero, Navbar glass, Cards, Inputs, Buttons)

## Run
```bash
npm install
npm run dev
```

> Not a medical device. Crisis support should route to local services.

## Auth

This demo uses a simple local auth stored in your browser (see `src/context/AuthContext.tsx`). No external services are required. Do not use real passwords.

## Environment

Create a `.env` (or `.env.local`) in the project root to configure client settings:

```bash
VITE_API_BASE=/api
VITE_GEMINI_MODEL=gemini-2.5-flash
# URL where the Personal-Voice-Assistant Flask app is served
VITE_ASSISTANT_URL=http://localhost:8001/
# YOLO detection API endpoint (data URL image POST)
VITE_YOLO_API=http://localhost:8002/yolo/detect
```

If `VITE_ASSISTANT_URL` is not set, the dashboard embed defaults to `http://localhost:8001/`.
