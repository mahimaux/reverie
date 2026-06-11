# Reverie — agent notes

This project targets **Expo SDK 56** (React Native 0.85, React 19.2). Read the
versioned docs at https://docs.expo.dev/versions/v56.0.0/ before changing native
config or dependency versions.

Key constraints:
- **New Architecture is on** (`newArchEnabled` default). Reanimated 4 requires it.
- **Animation:** `react-native-reanimated@4` + `react-native-worklets@0.8.x`. The
  babel plugin is `react-native-worklets/plugin` (must be last in
  `babel.config.js`) — NOT the old `react-native-reanimated/plugin`.
- **Routing:** Expo Router (`main` is `expo-router/entry`). Routes live in `/app`.
- **Installs:** `.npmrc` sets `legacy-peer-deps=true` to avoid a transitive
  `react-dom` peer conflict from the Google Fonts packages. Prefer
  `npx expo install <pkg>` so versions stay SDK-56-aligned, and
  `npx expo install --fix` after any SDK bump.
- **Full-stack.** Backend = Vercel serverless functions in `/api` (Claude via
  `@anthropic-ai/sdk`); shared backend code in `/server` (kept out of `/api` so
  Vercel doesn't route it). The app calls the backend when
  `EXPO_PUBLIC_API_BASE_URL` is set, else falls back to the on-device mock in
  `lib/api/`. `lib/api/client.ts` is the only seam the UI imports.
- **Two tsconfigs.** `tsconfig.json` excludes `api`/`server` (RN settings);
  `tsconfig.server.json` typechecks the backend (Node). Run `npm run typecheck`
  and `npm run typecheck:server`.
- **Backend deps stay server-side.** `@anthropic-ai/sdk` / `@vercel/node` must
  never be imported from app code (would break the Metro bundle). The API key
  lives only in Vercel env vars (`ANTHROPIC_API_KEY`).
