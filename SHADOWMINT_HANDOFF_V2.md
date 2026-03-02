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
- Fixed server/index.js, ES module syntax, env vars
- App running at localhost:5173 ✅
- Supabase env vars loading correctly ✅

### Phase 2 — UI & Theme
- Full **emerald/mint green + dark** color theme applied everywhere
- Primary accent: `#35f2a8` (mint)
- Deep green: `#0d7a5f`
- Background: `#060810`
- Card bg: `rgba(255,255,255,0.04)`
- Balance card gradient: `linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)`
- Font: DM Sans + DM Mono (already in global.css)

### Phase 3 — Supabase Schema (ALL TABLES LIVE ✅)
Tables created and RLS enabled:
- `profiles` — auto-created on signup via trigger
- `wallets` — auto-created on signup, balance in **cents** (e.g. 250000 = $2,500.00)
- `transactions` — type: credit/debit, category: transfer/deposit/withdrawal/request/fee/refund
- `bank_accounts` — saved BSB + account numbers
- `kyc_status` — auto-created on signup
- `payment_requests` — request money flow

RPC function also created:
```sql
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email TEXT)
RETURNS TABLE(id UUID)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE auth.users.email = $1 LIMIT 1;
$$;
```

### Phase 4 — Pages Built

**Auth:**
- `src/screens/Login.tsx` ✅
- `src/screens/SignUp.tsx` ✅
- `src/pages/SplashScreen.tsx` ✅
- `src/components/ProtectedRoute.tsx` ✅

**Core:**
- `src/App.tsx` ✅ — includes BottomNav
- `src/components/BottomNav.tsx` ✅ — 5 tabs: Wallet, Activity, Send (floating), Request, Profile. Auto-hides on auth/flow pages.

**Wallet:**
- `src/pages/Wallet/WalletOverviewPage.tsx` ✅ — balance card, 4 action buttons, recent transactions

**Send Money (3-page flow):**
- `src/pages/Send/SendMoneyPage.tsx` ✅ — recipient email, amount + quick amounts, note, balance check
- `src/pages/Send/SendReviewPage.tsx` ✅ — review card, debits sender, credits recipient, records both transactions
- `src/pages/Send/SendSuccessPage.tsx` ✅ — animated ✓, auto-redirects after 4s

**Activity:**
- `src/pages/Activity/ActivityPage.tsx` ✅ — grouped by date, filter pills, search, skeleton loader
- `src/pages/Activity/TransactionDetailsPage.tsx` ✅ — full breakdown, hero card, transaction ID

**Deposit:**
- `src/pages/Deposit/BankDepositInstructionPage.tsx` ✅ — bank details, unique reference per user, copy buttons, copy all

**Withdraw (3-page flow):**
- `src/pages/Withdraw/WithdrawPage.tsx` ✅ — amount + quick amounts + Max, saved accounts, new account form with save toggle
- `src/pages/Withdraw/WithdrawConfirmPage.tsx` ✅ — amber hero card, full breakdown, debits wallet, saves account if new
- `src/pages/Withdraw/WithdrawSuccessPage.tsx` ✅ — 🏧 animated icon, receipt, auto-redirects after 5s

**Profile:**
- `src/pages/Wallet/ProfilePage.tsx` ✅ — avatar initials, balance + KYC badges, menu sections
- `src/pages/Profile/EditProfilePage.tsx` ✅ — full profile form, saves to Supabase
- `src/pages/Profile/BankDetailsPage.tsx` ✅ — list/add/remove/set-default bank accounts

---

## 🔧 SUPABASE CONFIG

- URL: `https://isdiomwcqcfefebzudpd.supabase.co`
- Anon key: `sb_publishable_YequU0Twarq7cLeTYalyxw_T87ggxSS`
- Auth confirmed working ✅
- Test wallet seeded with $2,500.00 (balance = 250000 cents) ✅

---

## 📋 NEXT STEPS (in order)

1. **KYC Flow** — 7 pages:
   - `KycStartPage` — intro + start button
   - `KycDocumentTypePage` — choose passport or driver's licence
   - `KycDocumentUploadPage` — upload front (+ back for licence)
   - `KycSelfiePage` — selfie capture
   - `KycPendingPage` — submitted, waiting for review
   - `KycSuccessPage` — verified!
   - `KycFailedPage` — failed with reason

2. **Request Money flow** — `RequestJust.tsx` (already stubbed at `/request`)

3. **Wire up backend routes** in `server/index.js`

4. **Build server stubs** — controllers/routes/models

5. **PublicPaymentPage** — `/pay/:username` (already stubbed)

6. **ActiveSessionsPage** — `/settings/sessions` (already stubbed)

---

## 🗺️ ROUTES (all defined in src/routes.tsx)

```
/                    → SplashScreen
/login               → Login
/signup              → SignUp
/wallet              → WalletOverviewPage (protected)
/send                → SendMoneyPage (protected)
/send/review         → SendReviewPage (protected)
/send/success        → SendSuccessPage (protected)
/request             → RequestJust (protected)
/activity            → ActivityPage (protected)
/activity/:id        → TransactionDetailsPage (protected)
/deposit/bank        → BankDepositInstructionPage (protected)
/withdraw            → WithdrawPage (protected)
/withdraw/confirm    → WithdrawConfirmPage (protected)
/withdraw/success    → WithdrawSuccessPage (protected)
/profile             → ProfilePage (protected)
/profile/edit        → EditProfilePage (protected)
/profile/bank-details → BankDetailsPage (protected)
/kyc                 → KycStartPage (protected)
/kyc/document-type   → KycDocumentTypePage (protected)
/kyc/upload          → KycDocumentUploadPage (protected)
/kyc/selfie          → KycSelfiePage (protected)
/kyc/pending         → KycPendingPage (protected)
/kyc/success         → KycSuccessPage (protected)
/kyc/failed          → KycFailedPage (protected)
/settings/sessions   → ActiveSessionsPage (protected)
/pay/:username       → PublicPaymentPage (public)
```

---

## 🎨 COLOR TOKENS (use these everywhere)

```
Mint accent:     #35f2a8
Mint gradient:   linear-gradient(135deg, #35f2a8 0%, #18c87a 100%)
Deep green:      #0d7a5f
Balance card:    linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)
Background:      #060810
Card bg:         rgba(255,255,255,0.04)
Card border:     rgba(255,255,255,0.08)
Text primary:    #eef0f8
Text dim:        rgba(238,240,248,0.45)
Text muted:      rgba(238,240,248,0.28)
Danger:          #f87171
Warning:         #f6a623
Info:            #60a5fa
Button text:     #050c18 (on mint buttons)
```

---

## 🛠️ TERMINAL TIPS FOR STACKBLITZ

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

- `src/utils/supabase.ts` — Supabase client
- `src/routes.tsx` — All app routes
- `src/App.tsx` — Root layout with BottomNav
- `src/styles/global.css` — Global styles (imports theme.css)
- `src/styles/theme.css` — CSS variables (--mint, --bg, etc.)
- `server/index.js` — Express backend entry point
- `.env` — Frontend env vars (VITE_ prefixed)
- `server/.env` — Backend env vars

---

_Updated: 2026-03-02 | ShadowMint v2.0 — Phase 4 complete_
