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
    clarity: { free: 50, seeker: 100, signal: 9999 },
    decoder: { free: 50, seeker: 100, signal: 9999 },
    stars: { free: 50, seeker: 100, signal: 9999 },
    dynamic: { free: 50, seeker: 100, signal: 9999 },
    daily_advice: { free: 50, seeker: 100, signal: 9999 },
    objective: { free: 50, seeker: 100, signal: 9999 },
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
        console.log('[AI Proxy] Step 3: Parsing body');
        const body = await req.json();
        const { feature, prompt, context, image } = body;
        console.log('[AI Proxy] Feature:', feature);

        if (!feature || !SYSTEM_PROMPTS[feature]) {
            console.error('[AI Proxy] Invalid feature:', feature);
            throw new Error('Invalid feature requested');
        }

        // 4. Rate Limiting Check (Service Role for Bypass)
        console.log('[AI Proxy] Step 4: Rate limiting check');
        const serviceSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

        // Simplified usage check for stability
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        console.log('[AI Proxy] Querying usage for user:', user.id);
        const { count: usageCount, error: usageError } = await serviceSupabase
            .from('ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('feature', feature)
            .gte('created_at', todayStart.toISOString());

        if (usageError) {
            console.error('[AI Proxy] Usage Check Error:', usageError.message);
        }

        const currentUsage = usageCount ?? 0;
        console.log('[AI Proxy] Current usage:', currentUsage);
        const limit = RATE_LIMITS[feature]?.free ?? 5;

        if (currentUsage >= limit) {
            console.log('[AI Proxy] Limit reached, checking profile tier');
            const { data: profile, error: profileError } = await serviceSupabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('[AI Proxy] Profile Check Error:', profileError.message);
            }

            const tier = profile?.subscription_tier ?? 'free';
            const tierLimit = RATE_LIMITS[feature]?.[tier as 'free' | 'seeker' | 'signal'] ?? limit;
            console.log(`[AI Proxy] User Tier: ${tier}, Limit: ${tierLimit}`);

            if (currentUsage >= tierLimit) {
                console.warn('[AI Proxy] Hard limit reached for user');
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
        console.log('[AI Proxy] Step 5: Calling Gemini');
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        const systemPrompt = SYSTEM_PROMPTS[feature];

        // Prepare contents for Gemini multimodal API
        const parts: any[] = [
            { text: `${systemPrompt}\n\nContext:\n${context || 'None'}\n\nPrompt:\n${prompt}` }
        ];

        // Add image part if provided
        if (image && image.data && image.mimeType) {
            console.log('[AI Proxy] Including image in request');
            parts.push({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data
                }
            });
        }

        const modelId = 'gemini-2.0-flash';

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        response_mime_type: (feature === 'stars' || feature === 'daily_advice' || feature === 'decoder') ? "application/json" : "text/plain"
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ]
                }),
            }
        );

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('[Gemini API Error]', JSON.stringify(data));
            return new Response(JSON.stringify({
                error: 'GEMINI_ERROR',
                message: data.error?.message || 'Gemini API failed'
            }), {
                status: 502,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        // Handle potential safety blocks or empty responses
        if (data.promptFeedback?.blockReason) {
            return new Response(JSON.stringify({
                error: 'SAFETY_BLOCK',
                message: `The request was blocked for safety: ${data.promptFeedback.blockReason}`
            }), {
                status: 400,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        const candidate = data?.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error('AI response blocked by safety filters');
        }

        const result = candidate?.content?.parts?.[0]?.text || '';

        if (!result && candidate?.finishReason) {
            throw new Error(`AI failed to generate response. Reason: ${candidate.finishReason}`);
        }

        // 6. Log Usage (Fire and forget, don't await to avoid blocking)
        serviceSupabase.from('ai_usage').insert({
            user_id: user.id,
            feature,
            tokens_used: result.length + (prompt?.length || 0)
        }).then(({ error }) => {
            if (error) console.error('[AI Proxy] Usage Log Error:', error.message);
        });

        return new Response(JSON.stringify({ result }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[AI Proxy] Global Catch:', error.message);
        return new Response(JSON.stringify({
            error: 'INTERNAL_SERVER_ERROR',
            message: error.message,
            details: error.stack
        }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }
});
