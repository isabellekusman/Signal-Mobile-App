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
  - Gemini API key accessed from server env only
  - Usage logging
  - Content safety filters
- ✅ Excluded Edge Functions from Expo TypeScript config

### Database Service Layer
- ✅ Created `services/database.ts` with typed CRUD operations
- ✅ Profile, connection, usage, and account deletion operations
- ✅ Ready for future migration from AsyncStorage → Supabase

---

## 🔲 TODO — Requires Your Action

### 1. Set Up Supabase Project
If you haven't already:
1. Go to [supabase.com](https://supabase.com) → Create a project
2. Go to **Settings → API** and copy:
   - Project URL → put in `.env` as `EXPO_PUBLIC_SUPABASE_URL`
   - Anon key → put in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`

### 2. Deploy AI Proxy Edge Function
```bash
# Install Supabase CLI if not done
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the Gemini API key as a server secret
supabase secrets set GEMINI_API_KEY=your-key-here

# Deploy the function
supabase functions deploy ai-proxy
```

### 3. Rotate Exposed Gemini API Key
Your current key (`AIzaSyCJP4...`) was committed in client code.
1. Go to Google Cloud Console → API Keys
2. Rotate/regenerate the key
3. Update the new key in Supabase secrets (step 2 above)
4. Once the AI proxy is deployed, remove `EXPO_PUBLIC_GEMINI_API_KEY` from `.env`

### 4. Enable Auth Providers (Optional)
In Supabase Dashboard → Authentication → Providers:
- Enable **Email** (already works)
- Optionally enable **Google** and **Apple** sign-in

### 5. Subscription System (B-6)
Still needed before monetization:
- Integrate RevenueCat for App Store subscriptions
- Create paywall component
- Gate AI features behind premium check

### 6. Migrate aiService.ts to Use Edge Function
Once the Edge Function is deployed, update `services/aiService.ts` to call through Supabase:
```typescript
const { data } = await supabase.functions.invoke('ai-proxy', {
  body: { feature: 'clarity', prompt: userInput, context: connectionContext }
});
```
