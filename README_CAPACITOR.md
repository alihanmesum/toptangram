Capacitor Quick Start (notes)

1. Install Capacitor CLI and runtime:

```bash
npm install --save @capacitor/core @capacitor/cli
```

2. Build web assets and init Capacitor (uses `webDir` = `out` in `capacitor.config.json`):

```bash
npm run build
npm run cap:init
npm run cap:sync
```

3. Add platforms:

```bash
npx cap add android
npx cap add ios
npm run cap:open:android
npm run cap:open:ios
```

Notes:
- Next.js `next export` may not work with `app/` router pages. For production, consider a static-ready minimal build or use a small wrapper server that serves the Next build output.
- For rapid MVP, you can host the Next app and point Capacitor to a remote `server.url` during development (see Capacitor docs).
- Ensure environment variables are set before building: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
