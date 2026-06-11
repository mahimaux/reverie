# Reverie

> A bestie-tarot-reader in your pocket that talks you down from comparison
> spirals and reframes them into calm, useful self-belief.

A React Native + **Expo SDK 56** (TypeScript) frontend, built from the attached
PRD and TRD. Warm, glassmorphic, a little mystical — inspired by the reference
image (ivory surfaces, frosted cards, one near-black contrast surface, and a
single warm orange→peach "sun" gradient accent).

## Running it

```bash
cd reverie
npm install          # .npmrc pins legacy-peer-deps for the font packages
npx expo start       # press i / a, or scan with Expo Go (Dev Client recommended)
```

> Uses the New Architecture + Reanimated 4, so a **development build** (or a
> recent Expo Go) is needed for the animations. `npx expo run:ios` /
> `run:android` builds a dev client.

## What's implemented (PRD MVP)

- **The full 3-chapter reading** with one shared, compounding `ReadingContext`:
  1. **Behind-the-Scenes Reality Check** — feeling chips → situation → reframe.
  2. **Reclaim Your Superpower** — generated mini-interview → 3 affirmations.
  3. **Letter From Future You** — generated questions → printed letter, archived.
- **The three signature animations** (`react-native-reanimated`):
  - **Shuffle** that doubles as the AI loading state (latency masking, TRD §3.1).
  - **3D flip** (`rotateY` + perspective, back-face hidden) — any card reveals the
    *same* prepared content (TRD §3.2).
  - **Receipt print** — the future-self letter prints line by line.
- **Daily streak + sticker book** with the gentle guardrail (a broken streak gets
  a soft "welcome back", never guilt). Milestone stickers at 7/30/100.
- **Your Letters** archive + a full-letter reader.
- **Settings** — optional first name, notifications toggle, privacy note, support
  resources, and "reset / delete all my data" (local wipe).
- **Safety pre-check** — distress-signalling free text routes to a supportive
  resources screen instead of a reframe (TRD §8).
- **Optional before/after mood check** for the "relief" metric (PRD §12).
- **Reduced-motion** fallbacks throughout (TRD §9).
- **Local-first, no account** (AsyncStorage document model).

## Architecture

```
/app                     Expo Router routes
  index.tsx              Home / Today
  onboarding.tsx         One-screen welcome + optional first name
  reading/
    feelings.tsx         Ch.1 inputs (chips + situation + optional mood)
    chapter1.tsx         Ch.1 draw + reframe
    chapter2.tsx         Ch.2 interview → draw → affirmations
    chapter3.tsx         Ch.3 questions → printer → letter
    complete.tsx         Save reading, award sticker, mood-after
    safety.tsx           Supportive path
  stickers.tsx           Sticker book + streak stats
  letters.tsx            Letters archive
  letter/[id].tsx        Letter reader
  settings.tsx
/components               Screen, FrostCard, PillButton, FeelingChip, CardBack,
                         CardFace, FlipCard, ShuffleDeck, PrinterReveal,
                         StickerTile, MoodSlider, SunBlob, bits
/features
  reading/               ReadingProvider (flow state machine)
  streaks/               streak logic + sticker pool
/lib
  api/                   client (facade) + mockApi + safety
  storage/               AsyncStorage document repo
  motion/                reduced-motion guard
  types.ts               data model (TRD §4)
/theme                   tokens + typography (Inter + Fraunces)

/api                     Vercel serverless functions (the backend, TRD §5)
  reframe.ts             POST /reframe (+ inline safety pre-check)
  superpower-questions.ts
  affirmations.ts
  letter-questions.ts
  letter.ts
  safety-check.ts
/server                  shared backend code (kept out of /api so it isn't routed)
  anthropic.ts           Claude client, JSON parse + retry, em-dash scrub
  persona.ts             system prompt + per-endpoint instructions (TRD §7)
  schemas.ts             output validators (TRD §6)
  http.ts                CORS, method guard, body parsing, metrics
  ratelimit.ts           best-effort in-memory limiter
```

## Full-stack: how the AI works

A **thin client + thin backend** (TRD §1). The backend exists almost entirely to
keep the Anthropic API key off the device and enforce the persona/output
contract. It's stateless: it receives inputs, calls Claude, returns structured
JSON, and logs only anonymous metrics — **no raw user text is persisted or
logged** (TRD §5, §8).

- **Backend** — Vercel serverless functions in `/api`, calling Claude via
  `@anthropic-ai/sdk`. Each endpoint builds the shared persona prompt + an
  endpoint instruction + a strict "return only JSON" directive, validates the
  shape, retries once on failure, and scrubs em dashes. Models are env-driven:
  `claude-sonnet-4-6` for the quick generations, `claude-opus-4-8` for the
  letter (TRD §6).
- **Client** — the UI only ever imports from **`lib/api/client.ts`**. If
  `EXPO_PUBLIC_API_BASE_URL` is set it calls the deployed backend; otherwise (or
  if a call fails) it falls back to the on-device mock in `lib/api/mockApi.ts`,
  so the app always works in development and degrades gracefully.

The persona instructs Claude to read the input closely, gently refute negative
self-talk (never just agree), ask follow-up questions anchored to the Chapter 1
situation, vary every reading, and never use em dashes.

## Deploy (GitHub + Vercel)

1. **Push to GitHub.** From this folder:
   ```bash
   git init && git add . && git commit -m "Reverie full-stack"
   gh repo create reverie --private --source=. --push   # or push to a repo you made
   ```
2. **Import into Vercel.** New Project → import the GitHub repo. Vercel
   auto-detects the functions in `/api` (the `vercel.json` sets their max
   duration). No build step is required for the API.
3. **Set the environment variable** in the Vercel project settings:
   `ANTHROPIC_API_KEY` (required); optionally `ANTHROPIC_MODEL` /
   `ANTHROPIC_MODEL_LETTER`. Redeploy.
4. **Point the app at it.** Put your deployment URL in `.env`:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://<your-project>.vercel.app
   ```
   Rebuild the app (`npx expo start`) — it now calls the live backend. The app
   appends `/api/<endpoint>` to that base.

Endpoints: `POST /api/reframe`, `/api/superpower-questions`, `/api/affirmations`,
`/api/letter-questions`, `/api/letter`, `/api/safety-check`. See `.env.example`.

> The API key lives only in Vercel env vars and is never in the client bundle
> (acceptance criteria). The web frontend can also be deployed (`npx expo export
> --platform web`), but the primary client is the mobile app.

## Design tokens

See `theme/tokens.ts` and `theme/typography.ts`. Palette and radii come from
TRD §10. Display/UI = **Inter** (light neo-grotesque); editorial moments (card
quotes, the letter) = **Fraunces** serif — both open-licensed.
```
bg ivory #F2ECE4 · frost rgba(255,255,255,.55) · dark #121110
sun gradient #FF6A00 → #FF9D4D → #FFD0A3 · radius card 28 / pill 999
```

## Decisions taken (PRD §14 open questions)

Built on the TRD `[DEFAULT]`s: native app · no login (local-only) · streak
triggers on **completing a reading** · optional first name · mood check included
· notifications stubbed for v2.
