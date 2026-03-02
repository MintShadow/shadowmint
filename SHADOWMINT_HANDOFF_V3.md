# ShadowMint v3.0 — Project Handoff
_Paste this into a new Claude chat to continue exactly where we left off._

---

## 🧠 CONTEXT FOR CLAUDE

Hi Claude! I'm building **ShadowMint v3.0**, a React + TypeScript fintech wallet app in StackBlitz (WebContainers). Here's exactly where we are:

---

## 📁 PROJECT

- **Path:** `/home/projects/vitejs-vite-qq3dffkj`
- **Stack:** React 18 + TypeScript + Vite 5.4.21, Tailwind, Zustand, React Router 6, Supabase, Capacitor
- **Backend:** Express 5.2.1 + Node 20.19.1 (server/ folder)
- **Environment:** StackBlitz WebContainers (jsh shell — no bash redirects, no printf, use Node REPL to write files)

---

## ⚠️ IMPORTANT: ENCODING ISSUE

All files were affected by a UTF-8 encoding corruption bug in StackBlitz. Special characters (emojis, arrows, dashes, quotes) get corrupted. When writing new code:
- Use plain ASCII alternatives where possible
- For emojis, use them directly in JSX (e.g. `💸`) — they render fine
- NEVER use special unicode dashes like `–` or `—`, use `-` instead
- NEVER use curly quotes `"` `"`, use straight quotes `"` instead
- The `·` separator should be written as `&middot;` or just ` · ` with spaces

---

## ✅ COMPLETED — ALL PHASES DONE

### Phase 1 — Foundation ✅
- Fixed server/index.js, ES module syntax, env vars
- App running at localhost:5173

### Phase 2 — UI & Theme ✅
- Full **emerald/mint green + dark** color theme
- Primary accent: `#35f2a8` (mint)
- Deep green: `#0d7a5f`
- Background: `#060810`
- Card bg: `rgba(255,255,255,0.04)`
- Balance card gradient: `linear-gradient(135deg, #065f46 0%, #0d7a5f 40%, #10b981 100%)`
- Font: DM Sans + DM Mono

### Phase 3 — Supabase Schema ✅
All tables live with RLS enabled:
- `profiles` — auto-created on signup via trigger
- `wallets` — auto-created on signup, balance in **cents**
- `transactions` — type: credit/debit, category: transfer/deposit/withdrawal/request/fee/refund
- `bank_accounts` — saved BSB + account numbers
- `kyc_status` — auto-created on signup
- `payment_requests` — request money flow

RPC function:
```sql
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email TEXT)
RETURNS TABLE(id UUID)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE auth.users.email = $1 LIMIT 1;
$$;
```

### Phase 4 — All Pages Built ✅

**Auth:**
- `src/screens/Login.tsx` ✅
- `src/screens/SignUp.tsx` ✅
- `src/pages/SplashScreen.tsx` ✅
- `src/components/ProtectedRoute.tsx` ✅

**Core:**
- `src/App.tsx` ✅
- `src/components/BottomNav.tsx` ✅ — 5 tabs: Wallet, Activity, Send (floating), Request, Profile

**Wallet:**
- `src/pages/Wallet/WalletOverviewPage.tsx` ✅ — balance card, 4 action buttons (Send/Request/Deposit/Withdraw), recent transactions

**Send Money (3-page flow):**
- `src/pages/Send/SendMoneyPage.tsx` ✅
- `src/pages/Send/SendReviewPage.tsx` ✅
- `src/pages/Send/SendSuccessPage.tsx` ✅

**Activity:**
- `src/pages/Activity/ActivityPage.tsx` ✅
- `src/pages/Activity/TransactionDetailsPage.tsx` ✅

**Deposit:**
- `src/pages/Deposit/BankDepositInstructionPage.tsx` ✅

**Withdraw (3-page flow):**
- `src/pages/Withdraw/WithdrawPage.tsx` ✅
- `src/pages/Withdraw/WithdrawConfirmPage.tsx` ✅
- `src/pages/Withdraw/WithdrawSuccessPage.tsx` ✅

**Profile:**
- `src/pages/Wallet/ProfilePage.tsx` ✅
- `src/pages/Profile/EditProfilePage.tsx` ✅
- `src/pages/Profile/BankDetailsPage.tsx` ✅

### Phase 5 — Final Features ✅

**KYC Flow (7 pages):**
- `src/pages/Kyc/KycStartPage.tsx` ✅
- `src/pages/Kyc/KycDocumentTypePage.tsx` ✅
- `src/pages/Kyc/KycDocumentUploadPage.tsx` ✅ — uploads to Supabase storage `kyc-documents` bucket
- `src/pages/Kyc/KycSelfiePage.tsx` ✅ — uploads selfie to storage
- `src/pages/Kyc/KycPendingPage.tsx` ✅
- `src/pages/Kyc/KycSuccessPage.tsx` ✅
- `src/pages/Kyc/KycFailedPage.tsx` ✅

**Request Money:**
- `src/pages/Request/RequestJust.tsx` ✅ — full request flow, inserts into `payment_requests` table

**Public Payment Page:**
- `src/pages/Public/PublicPaymentPage.tsx` ✅ — `/pay/:username`, works for logged-in and logged-out users

**Active Sessions:**
- `src/components/Settings/ActiveSessionPage.tsx` ✅ — shows current device, revoke sessions, sign out all

---

## 🔧 SUPABASE CONFIG

- URL: `https://isdiomwcqcfefebzudpd.supabase.co`
- Anon key: `sb_publishable_YequU0Twarq7cLeTYalyxw_T87ggxSS`
- Auth confirmed working ✅

### Storage Bucket
- Bucket: `kyc-documents` (private, 10MB limit, image/* + application/pdf)
- RLS policies use `(storage.foldername(name))[2]` to match `kyc/{userId}/filename` path structure

---

## 🗺️ ROUTES (all defined in src/routes.tsx)

```
/                       → SplashScreen
/login                  → Login
/signup                 → SignUp
/pay/:username          → PublicPaymentPage (public)
/wallet                 → WalletOverviewPage (protected)
/send                   → SendMoneyPage (protected)
/send/review            → SendReviewPage (protected)
/send/success           → SendSuccessPage (protected)
/request                → RequestJust (protected)
/activity               → ActivityPage (protected)
/activity/:id           → TransactionDetailsPage (protected)
/deposit/bank           → BankDepositInstructionPage (protected)
/withdraw               → WithdrawPage (protected)
/withdraw/confirm       → WithdrawConfirmPage (protected)
/withdraw/success       → WithdrawSuccessPage (protected)
/profile                → ProfilePage (protected)
/profile/edit           → EditProfilePage (protected)
/profile/bank-details   → BankDetailsPage (protected)
/kyc                    → KycStartPage (protected)
/kyc/document-type      → KycDocumentTypePage (protected)
/kyc/upload             → KycDocumentUploadPage (protected)
/kyc/selfie             → KycSelfiePage (protected)
/kyc/pending            → KycPendingPage (protected)
/kyc/success            → KycSuccessPage (protected)
/kyc/failed             → KycFailedPage (protected)
/settings/sessions      → ActiveSessionsPage (protected)
```

---

## 🎨 COLOR TOKENS

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

## 📋 POSSIBLE NEXT STEPS

1. **Deploy to Vercel** — push to GitHub, connect to Vercel, add env vars
2. **Build as native app** — project already has Capacitor set up with `android/` and `ios/` folders
3. **Admin dashboard** — approve/reject KYC submissions, view all transactions
4. **Push notifications** — notify users when they receive money or a request
5. **Payment request approval flow** — let users see incoming requests and approve/decline them
6. **Real bank integration** — connect to a real payment rail (e.g. Monoova, Zepto for AU)

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
- `src/styles/global.css` — Global styles
- `src/styles/theme.css` — CSS variables
- `server/index.js` — Express backend entry point
- `.env` — Frontend env vars (VITE_ prefixed)
- `server/.env` — Backend env vars

---

_Updated: 2026-03-03 | ShadowMint v3.0 — All phases complete_ 🎉
