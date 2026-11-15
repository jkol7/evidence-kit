# Evidence Kit

Interactive in-world props that players open on their own phones.

## Features

- **Phone prop** with a passcode lock screen, wrong-code shake and timed hints
- **Lock rules** that can be combined: passcodes, keywords, GM reveals, timed unlocks and "after X is open" chains
- **Forgiving answers:** keyword matching ignores case, accents, punctuation and extra spaces
- **Setup checking:** the engine catches broken props before game night, such as duplicate ids, missing references or two items that wait on each other forever
- **Saved progress:** play state is stored in the browser and survives a refresh
- **Sample case:** *The Harbor Light*, a missing bookkeeper's phone

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Validation | zod |
| Tests | Vitest |
| Linting | ESLint (`eslint-config-next`) |
| CI | GitHub Actions (lint, typecheck, test, build) |
| Hosting | Vercel |

## Getting started

Requires Node 22 (pinned in `.nvmrc`).

```bash
git clone https://github.com/YOUR-USERNAME/evidence-kit.git
cd evidence-kit
nvm use          # optional, picks up Node 22 from .nvmrc
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose **Dana Whitlock's phone**.

To test on a phone on the same Wi-Fi, open the Network URL that `npm run dev` prints. Its IP must be listed in `allowedDevOrigins` in `next.config.ts`, or Next.js will block dev resources and the page will stay blank.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | Check types with `tsc --noEmit` |
| `npm run lint` | Run ESLint |

CI runs lint, typecheck, test and build on every push and pull request.

## How it works

Data flows one way through five layers:

```
Data model  →  Unlock engine  →  State hook  →  UI components  →  Routes
(types +       (pure TS,         (React +       (phone screens)    (/p/[propId])
 zod schema)    no React)         localStorage)
```

### Project structure

```
src/
├── app/                    Routes: / lists samples, /p/[propId] renders a prop
├── components/phone/       Phone frame, loader, lock screen, home screen
├── data/samples/           Sample props (harbor-light.ts)
├── hooks/usePlayState.ts   Connects the engine to React and saves progress
└── lib/
    ├── props/              types.ts (prop shapes) and schema.ts (zod + parseProp)
    ├── unlock/             graph.ts, engine.ts, normalize.ts
    └── play/storage.ts     Validated save and load for play state
```

### Lock rules

| Rule | Opens when |
| --- | --- |
| `passcode` | The exact code is entered on the keypad |
| `keyword` | A matching answer is typed (forgiving match) |
| `gm` | The GM reveals it |
| `time` | A set moment passes |
| `after` | Other named items are open |
| `all` / `any` | Every / at least one nested rule passes |

Any rule can show a hint after a set number of wrong attempts.

### Design decisions

- **The engine knows nothing about phones.** It only sees ids and rules, so future prop types (websites, inboxes, locked documents) can reuse it unchanged.
- **Unlock status is derived, never stored.** Player state only records solved challenges, GM reveals and attempt counts. Whether something is open is always worked out from the rules, so saved state can't drift out of sync with the prop.
- **Parents gate children.** A note can't open while its phone is still locked.
- **Props are plain data,** validated with zod, so they're easy to store, edit and export later.
- **The phone renders in the browser only.** Saved progress lives in `localStorage`, so the phone skips server rendering and shows "Loading…" until it's ready. This avoids a mismatch between server and browser output.

### Testing

The engine, schema and storage are pure functions, so they're covered by fast unit tests. An integration test plays the whole *Harbor Light* case through the real schema, graph and engine to check that every clue leads to the next.

The `usePlayState` hook has no dedicated test yet. It's mostly wiring, and the logic it calls is already tested. Browser tests (jsdom + React Testing Library) will be added if it grows.

## Known limitations

- **Answers ship to the browser,** so a player could find them in dev tools. Answer checking will move server-side before any public launch.
- **Progress is per browser.** There's no shared session or live GM control across devices yet.
- **No editor.** Props are written as TypeScript data files for now.