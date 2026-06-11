# Reverie — agent notes

This project targets **Expo SDK 54** (React Native 0.81, React 19.1). Read the
versioned docs at https://docs.expo.dev/versions/v54.0.0/ before changing native
config or dependency versions.

Key constraints:
- **New Architecture is on** (`newArchEnabled: true`). Reanimated 4 requires it.
- **Animation:** `react-native-reanimated@4` + `react-native-worklets@0.5.x`. The
  babel plugin is `react-native-worklets/plugin` (must be last in
  `babel.config.js`) — NOT the old `react-native-reanimated/plugin`.
- **Routing:** Expo Router (`main` is `expo-router/entry`). Routes live in `/app`.
- **Installs:** `.npmrc` sets `legacy-peer-deps=true` to avoid a transitive
  `react-dom` peer conflict from the Google Fonts packages. Prefer
  `npx expo install <pkg>` so versions stay SDK-54-aligned, and
  `npx expo install --fix` after any SDK change.
- **expo-status-bar** on SDK 54 is the standalone `~3.0.x` package with NO config
  plugin — do not add `"expo-status-bar"` to `app.json` plugins (it 's only a
  plugin on SDK 56+).
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
