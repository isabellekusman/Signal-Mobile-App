/**
 * Supabase Edge Function: AI Proxy
 *
 * This function:
 * 1. Validates the user's Supabase JWT
 * 2. Checks rate limits from ai_usage table
 * 3. Proxies the request to Gemini API (key stays server-side)
 * 4. Logs usage to ai_usage table
 * 5. Returns the AI response
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Rate limits per feature per day
const RATE_LIMITS: Record<string, { free: number; seeker: number; signal: number }> = {
    clarity: { free: 10, seeker: 25, signal: 9999 },
    decoder: { free: 5, seeker: 25, signal: 9999 },
    stars: { free: 5, seeker: 25, signal: 9999 },
    dynamic: { free: 10, seeker: 25, signal: 9999 },
    daily_advice: { free: 5, seeker: 25, signal: 9999 },
    objective: { free: 5, seeker: 25, signal: 9999 },
};

// System prompts
const SYSTEM_PROMPTS: Record<string, string> = {
    clarity: `You are a grounded, perceptive, emotionally intelligent friend who tells the truth with care. Help the user see relationship dynamics clearly.`,
    decoder: `Analyze text messages/threads. Return strict JSON with tone, effort, subtext, and motivation.`,
    stars: `Expert astrologer. Return JSON with daily forecast, transits, and strategy based on zodiac signs.`,
    dynamic: `Objective behavioral analysis summary of connection health.`,
    daily_advice: `Relationship advisor. Return JSON with stateOfConnection, todaysMove, and watchFor terms.`,
    objective: `Objective evaluation of connection signals and consistency.`,
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
        // 2. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Unauthorized access');
        }

        // 3. Parse Body
        const { feature, prompt, context, image } = await req.json();

        if (!feature || !SYSTEM_PROMPTS[feature]) {
            throw new Error('Invalid feature requested');
        }

        // 4. Rate Limiting Check (Service Role for Bypass)
        const serviceSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

        // Simplified usage check for stability
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: usageCount, error: usageError } = await serviceSupabase
            .from('ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('feature', feature)
            .gte('created_at', todayStart.toISOString());

        if (usageError) {
            console.error('[Usage Check Error]', usageError.message);
            // We'll allow the request to proceed if usage check fails to avoid blocking the user 
            // unless it's a critical production environment where we must enforce limits.
        }

        const currentUsage = usageCount ?? 0;
        const limit = RATE_LIMITS[feature]?.free ?? 5;

        if (currentUsage >= limit) {
            // Check if user is premium
            const { data: profile, error: profileError } = await serviceSupabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('[Profile Check Error]', profileError.message);
            }

            const tier = profile?.subscription_tier ?? 'free';
            const tierLimit = RATE_LIMITS[feature]?.[tier as 'free' | 'seeker' | 'signal'] ?? limit;

            if (currentUsage >= tierLimit) {
                return new Response(JSON.stringify({
                    error: 'LIMIT_REACHED',
                    message: `You have reached your daily limit for ${feature}.`,
                    usage: currentUsage,
                    limit: tierLimit
                }), {
                    status: 429,
                    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                });
            }
        }

        // 5. Call Gemini
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        const systemPrompt = SYSTEM_PROMPTS[feature];

        // Prepare contents for Gemini multimodal API
        // Use 'any' to avoid TS errors with inlineData
        const parts: any[] = [
            { text: `${systemPrompt}\n\nContext:\n${context || 'None'}\n\nPrompt:\n${prompt}` }
        ];

        // Add image part if provided
        if (image && image.data && image.mimeType) {
            parts.push({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data
                }
            });
        }

        const modelId = 'gemini-2.0-flash';

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts }] }),
            }
        );

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('[Gemini API Error]', JSON.stringify(data));
            throw new Error(`Gemini Error: ${data.error?.message || JSON.stringify(data)}`);
        }

        // Handle potential safety blocks or empty responses
        if (data.promptFeedback?.blockReason) {
            throw new Error(`AI Safety Block: ${data.promptFeedback.blockReason}`);
        }

        const candidate = data?.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error('AI response blocked by safety filters');
        }

        const result = candidate?.content?.parts?.[0]?.text || '';

        if (!result && candidate?.finishReason) {
            throw new Error(`AI failed to generate response. Reason: ${candidate.finishReason}`);
        }

        // 6. Log Usage (Async)
        try {
            await serviceSupabase.from('ai_usage').insert({
                user_id: user.id,
                feature,
                tokens_used: result.length + (prompt?.length || 0)
            });
        } catch (logError) {
            console.error('Failed to log usage:', logError);
        }

        return new Response(JSON.stringify({ result }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Proxy Error:', error.message);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack,
            details: error.cause || 'No additional details'
        }), {
            status: error.message.includes('Unauthorized') ? 401 : 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }
});
