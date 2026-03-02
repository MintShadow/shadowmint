# ShadowMint — Fix Notes

## Changes Made

### 1. `src/utils/supabase.ts` (CRITICAL - replace existing file)
Supabase URL and anon key were hardcoded directly in the source file,
meaning they would be visible to anyone who inspects the app bundle.

**Fix:** Keys now read from environment variables via `import.meta.env`.

### 2. `.env` (place in project root, NOT in src/)
Add this file to your project root with your real Supabase credentials.
⚠️ Make sure `.env` is in your `.gitignore` — never commit this file.

### 3. `.env.example` (place in project root)
Safe to commit to git. Tells teammates what env vars are needed
without exposing the actual values.

### 4. `src/store/useTransactionStore.ts` (replace existing file)
Transaction store was running entirely on hardcoded mock data.

**Fix:** Now fetches real transactions from Supabase `transactions` table,
filtered by the currently logged-in user.

---

## What Still Needs Doing

### Connect remaining mock APIs
`src/utils/api.ts` still returns mock data for:
- `getProfile()` — connect to Supabase `profiles` table
- `sendPayment()` — connect to real payment logic
- `requestPayment()` — connect to real payment logic
- `getActivity()` — connect to Supabase activity/transactions table

### Supabase `transactions` table
Make sure your Supabase database has a `transactions` table with these columns:
- `id` (int, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `type` (text) — e.g. "sent", "received", "bank_deposit"
- `amount` (numeric)
- `currency` (text) — e.g. "AUD", "USDC"
- `from` (text, nullable)
- `to` (text, nullable)
- `date` (timestamp)
- `status` (text) — e.g. "completed", "pending", "failed"
- `notes` (text, nullable)

### Row Level Security (RLS)
Make sure RLS is enabled on your `transactions` table in Supabase,
with a policy that only allows users to see their own transactions:
```sql
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);
```

### App Icons
iOS currently only has one icon size. Apple requires multiple sizes.
Use a tool like https://appicon.co to generate all required sizes.
