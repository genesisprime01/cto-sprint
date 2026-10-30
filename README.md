# ⚡ CTO Sprint — 4-Week God Mode

Hasan's gamified learning platform: **Python + Postgres + LLM engineering**, 2–29 Nov 2026.
28 days of micro-missions, live in-browser Python & Postgres sandboxes, instant quizzes, XP, levels, streaks, badges, weekly boss fights, a 15/5 focus timer and a public learning journal.

**Live:** https://cto-sprint.vercel.app

| Week | Theme | Boss |
|---|---|---|
| 1 | Python + SQL + indexing on Docker Postgres | The Seq Scan Hydra |
| 2 | Replication, pooling (PgBouncer/Supavisor), partitioning, load test | The Connection Storm |
| 3 | Roles, pg_hba, SCRAM, RLS, Supabase Auth/JWT, pgAudit, Privacy Act/NDIS | The Cross-Tenant Leak Wraith |
| 4 | Ollama, pgvector RAG, evals, capstone: secure TLC Policy Assistant | The Hallucination Dragon |

## ✍️ Adding a journal entry (the important bit)

Every day already has a template in [`journal/`](journal/) named `w<week>d<day>.md` (e.g. `journal/w1d1.md`).

**Fastest (phone or laptop):**
1. On the day page, click **Edit on GitHub** (or open the file on GitHub and press the ✏️ pencil).
2. Replace the `_(write here)_` bits. Three lines is a win.
3. Click **Commit changes** → Vercel redeploys automatically in ~1 minute. The entry turns ✅ green on `/journal`.
4. Back on the day page, hit **I wrote it (+25 XP)**.

**Locally:**
```bash
git pull
code journal/w1d1.md        # edit
git commit -am "journal: w1d1" && git push
```

Tips: paste commit links, before/after numbers and screenshots (drop images in `public/img/` and use `![](/img/x.png)`). That turns the journal into a portfolio.

## 🎮 How the game works
- **Micro-missions** +10 XP · **Correct quiz (first try)** +20 · **Sandbox run** +15 · **Focus block 🍅** +15 · **Journal** +25
- **Clear a day** +100 (review +150, ship +300) · **Beat a boss (≥80%)** +500 + badge
- Streak counts any day you earn XP. Progress is stored in your browser's localStorage; use **Export/Import** on the dashboard to move between devices.

## 🛠 Dev
```bash
npm install
npm run dev      # http://localhost:4321
npm run build
```
Content lives in `src/data/days.ts` (missions, quizzes, sandbox code, links). Game engine: `public/engine.js`. Styles: `public/style.css`.
Sandboxes load [Pyodide](https://pyodide.org) and [PGlite](https://pglite.dev) (real Postgres 17 in WASM, with pgvector + pgcrypto) from jsDelivr on first run.

Stack: Astro (static) on Vercel, auto-deployed from `main`.
