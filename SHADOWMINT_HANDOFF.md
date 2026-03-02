# ShadowMint v2.0 — Project Handoff
_Paste this into a new Claude chat to continue exactly where we left off._

---

## 🧠 CONTEXT FOR CLAUDE

Hi Claude! I'm building **ShadowMint v2.0**, a React + TypeScript fintech wallet app in StackBlitz (WebContainers). Here's exactly where we are:

---

## 📁 PROJECT

- **Path:** `/home/projects/vitejs-vite-qq3dffkj`
- **Stack:** React 18 + TypeScript + Vite 5.4.21, Tailwind, Zustand, React Router 6, Supabase, Capacitor
- **Backend:** Express 5.2.1 + Node 20.19.1 (server/ folder)
- **Environment:** StackBlitz WebContainers (jsh shell — no bash redirects, no printf, use Node REPL to write files)

---

## ✅ COMPLETED SO FAR

### Phase 1 — Foundation
- Fixed server/index.js (removed duplicate imports, fixed ES module syntax)
- Created root `.env` with Supabase + OneSignal keys (VITE_ prefixed)
- Created `server/.env` with backend keys
- Created `server/package.json` with `"type": "module"`
- Created stub `.tsx` files for all 30+ missing pages/components
- App is now running at localhost:5173/5174 ✅
- Supabase env vars loading correctly ✅

### Phase 2 — UI Pages Built
All pages use **emerald/teal green + white** color theme:
- Primary: `#0d7a5f`
- Accent: `#10b981`
- Background: `#050f0d` (near-black with green tint)
- Card bg: `rgba(13,122,95,0.12)`
- Border: `rgba(16,185,129,0.15)`
- Balance card gradient: `linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)`

**Pages completed:**
1. `src/pages/SplashScreen.tsx` — logo, animated dots, checks auth, redirects to /wallet or /login after 2.5s
2. `src/screens/Login.tsx` — email/password login with Supabase auth, error handling
3. `src/screens/SignUp.tsx` — signup with confirm password + email confirmation success screen
4. `src/components/ProtectedRoute.tsx` — checks Supabase session, redirects to /login if not authenticated
5. `src/pages/Wallet/WalletOverviewPage.tsx` — balance card, 4 action buttons (Send/Request/Deposit/Withdraw), recent transactions list

---

## 🔧 SUPABASE CONFIG

- URL: `https://isdiomwcqcfefebzudpd.supabase.co`
- Anon key: `sb_publishable_YequU0Twarq7cLeTYalyxw_T87ggxSS`
- Tables needed (NOT YET CREATED): `wallets`, `transactions`, `profiles`

---

## 🎨 PENDING — COLOR THEME UPDATE

We chose an **emerald green + white** theme (user uploaded a rich green satin image).
The old pages used purple (#7c3aed / #a855f7). We need to update them.

There is **no index.css or main.css** in the project yet — need to find the existing CSS file
(check src folder in StackBlitz for App.css or style.css) or add global styles via main.tsx.

Color swaps needed everywhere:
- `#7c3aed` → `#0d7a5f`
- `#a855f7` → `#10b981`  
- `#12091e` → `#050f0d`
- `#4b2d8a` → `#065f46`

---

## 📋 NEXT STEPS (in order)

1. **Fix global CSS** — find existing .css file or inject via main.tsx
2. **Apply green theme** to all completed pages
3. **Create Supabase tables** — SQL for wallets + transactions + profiles
4. **Build Send Money flow** — SendMoneyPage, SendReviewPage, SendSuccessPage
5. **Build Deposit page** — BankDepositInstructionPage
6. **Build Withdraw flow** — WithdrawPage, WithdrawConfirmPage, WithdrawSuccessPage
7. **Build Activity page** — ActivityPage, TransactionDetailsPage
8. **Build Profile pages** — ProfilePage, EditProfilePage, BankDetailsPage
9. **Build KYC flow** — 7 pages
10. **Build BottomNav component**
11. **Wire up backend routes** in server/index.js
12. **Build server stubs** — all missing controllers/routes/models

---

## 🛠 TERMINAL TIPS FOR STACKBLITZ

The shell is `jsh` — very limited. Use Node REPL for file operations:
```bash
node
> var fs = require('fs')
> fs.writeFileSync('/path/to/file', 'content')
> .exit
```
No `<<`, no `printf`, no bash redirects work.

---

## 📦 KEY FILES

- `src/utils/supabase.ts` — Supabase client (uses VITE_ env vars)
- `src/routes.tsx` — All app routes defined here
- `server/index.js` — Express backend entry point
- `.env` — Frontend env vars (root level)
- `server/.env` — Backend env vars

---

_Created: 2026-03-02 | ShadowMint v2.0 handoff document_
