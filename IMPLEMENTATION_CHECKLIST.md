# Signal Mobile — Implementation Checklist

## ✅ Completed (This Session)

### B-4: Connections Data Persistence
- ✅ Added `CONNECTIONS_KEY` to AsyncStorage
- ✅ Connections load on mount via `useEffect` 
- ✅ `addConnection`, `updateConnection`, `deleteConnection` all persist to AsyncStorage
- **File:** `context/ConnectionsContext.tsx`

### B-1: Authentication System
- ✅ Created `context/AuthContext.tsx` — wraps Supabase auth with session management
- ✅ Built real `app/login.tsx` — email/password sign up + sign in with validation
- ✅ Updated `app/_layout.tsx` — AuthProvider wraps app, AuthGate redirects unauthenticated users to /login
- ✅ Added Sign Out button to `app/(tabs)/settings.tsx` with AsyncStorage clear
- ✅ Added Delete Account button to `app/(tabs)/settings.tsx` (placeholder for server-side deletion)

### M-7: Onboarding Persistence Fixed
- ✅ Uncommented AsyncStorage persistence block in `ConnectionsContext.tsx`
- ✅ Removed `setHasCompletedOnboarding(false)` dev override
- ✅ Added `isLoaded` flag to prevent flash of onboarding screen

### B-3 + B-5: Database Schema + RLS
- ✅ Created `supabase/migrations/001_initial_schema.sql` with:
  - `profiles` table (auto-created on signup via trigger)
  - `connections` table with full JSONB support for signals/logs
  - `ai_usage` table for rate limiting
  - `device_tokens` table for push notifications
  - RLS policies on ALL tables (users can only access own data)
  - Performance indexes
  - Auto-update `updated_at` triggers

### B-2: AI Proxy (Server-Side)
- ✅ Created `supabase/functions/ai-proxy/index.ts` with:
  - JWT validation
  - Per-user, per-feature rate limiting
  - System prompts stored server-side (not exposed to client)
### Database Service Layer
- ✅ Created `services/database.ts` with typed CRUD operations
- ✅ Profile, connection, usage, and account deletion operations
- ✅ Account deletion now calls the secure Edge Function

### H-2 + H-6: Server-Side Security & Compliance
- ✅ Created `supabase/functions/delete-account/index.ts` — handles permanent auth + data deletion
- ✅ Created `supabase/functions/ai-proxy/index.ts` — handles AI requests with server-side prompts
- ✅ Deleted `services/prompts.ts` — prompts are no longer exposed in the client bundle

---

## 🔲 TODO — Requires Your Action

### 1. Set Up Supabase Project (Crucial)
- ✅ Project created and URL/Key added to `.env`
- ✅ SQL schema migrated via SQL Editor

### 2. Deploy Edge Functions (Completed)
- ✅ Supabase CLI installed
- ✅ Logged in and linked to project
- ✅ GEMINI_API_KEY set as server secret
- ✅ `ai-proxy` and `delete-account` functions deployed

### 3. Rotate and Secure Gemini API Key (Completed)
- ✅ Gemini API key secured on server
- ✅ `EXPO_PUBLIC_GEMINI_API_KEY` permanently removed from client `.env`
- ✅ Fallback code removed from `aiService.ts`
- ✅ `services/gemini.ts` deleted from client bundle

### 4. Enable Auth Providers (Optional)
In Supabase Dashboard → Authentication → Providers:
- Enable **Email** (already works)
- Optionally enable **Google** and **Apple** sign-in

### 5. Real Subscription Integration (B-6)
- [ ] Sign up for [RevenueCat](https://www.revenuecat.com/)
- [ ] Install `react-native-purchases`
- [ ] Replace the mock logic in `app/_layout.tsx` with real RevenueCat calls.

### 6. Final Polish
- [ ] Add a "Tap to Retry" button for failed AI requests (Offline Handling)
- [ ] Set up Sentry for error tracking
- [ ] Set up Privacy Policy and TOS links in Settings
