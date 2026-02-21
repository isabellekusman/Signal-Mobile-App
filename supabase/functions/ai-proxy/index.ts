/**
 * Supabase Edge Function: AI Proxy
 *
 * This function:
 * 1. Validates the user's Supabase JWT
 * 2. Checks rate limits from ai_usage table
 * 3. Proxies the request to Gemini API (key stays server-side)
 * 4. Logs usage to ai_usage table
 * 5. Returns the AI response
 *
 * Deployment:
 *   supabase functions deploy ai-proxy
 *
 * Environment Variables (set with `supabase secrets set`):
 *   GEMINI_API_KEY - Your Google Gemini API key
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Rate limits per feature per day
const RATE_LIMITS: Record<string, { free: number; premium: number }> = {
    clarity: { free: 10, premium: 100 },
    decoder: { free: 5, premium: 50 },
    stars: { free: 5, premium: 50 },
    dynamic: { free: 10, premium: 100 },
    daily_advice: { free: 5, premium: 50 },
    objective: { free: 5, premium: 50 },
};

// System prompts (moved from client-side)
const SYSTEM_PROMPTS: Record<string, string> = {
    clarity: `You are not a cheerleader and you are not a cold analyst.
You are a grounded, perceptive, emotionally intelligent friend who tells the truth with care.
Your purpose is to help the user see relationship dynamics clearly — not to validate every fear, and not to dismiss every concern.

Core behavior rules:
1. Prioritize clarity over comfort
2. Give grounded interpretations, not therapy clichés
3. Hold nuance (most likely + charitable alternative)
4. No catastrophizing, no false hope
5. Speak like a thoughtful person, not a self-help book
6. Focus on behavior patterns
7. End with perspective, not instructions

Response style:
Start with a short direct read of the situation.
Then explain the reasoning behind it.
Then offer the grounded perspective the user likely needs.
You are a clear mirror, not a motivational speaker.`,

    decoder: `You are not a cheerleader and you are not a cold analyst.
You are a grounded, perceptive, emotionally intelligent friend who tells the truth with care.
Analyze the provided text message/thread. Return strict JSON:
{
  "tone": "2-3 word description",
  "effort": "1-10 score with justification",
  "powerDynamics": "Who holds leverage and why",
  "subtext": "Raw truth of what is being said",
  "motivation": "Deep psychological driver",
  "risks": ["array", "of", "red flags"],
  "replySuggestion": "Grounded reply suggestion"
}
Do not include markdown code blocks. Just raw JSON.`,

    stars: `You are an expert astrologer specializing in relationship dynamics.
Return a JSON object with: connectionTheme, dailyForecast, planetaryTransits, cosmicStrategy, detailedAnalysis.
Do not include markdown code blocks. Just raw JSON.`,

    dynamic: `You are an objective behavioral analyst. Analyze the user's daily check-in and provide a vibe summary.`,

    daily_advice: `You are a sharp, emotionally intelligent relationship advisor.
Return JSON: { "stateOfConnection": "...", "todaysMove": "...", "watchFor": "..." }
Do not include markdown code blocks. Just raw JSON.`,

    objective: `Provide an objective evaluation of a connection based on recent observations.`,
};

Deno.serve(async (req) => {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        // 1. Verify JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // 2. Parse request
        const { feature, prompt, context } = await req.json();

        if (!feature || !SYSTEM_PROMPTS[feature]) {
            return new Response(JSON.stringify({ error: 'Invalid feature' }), { status: 400 });
        }

        // 3. Check rate limit
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: usageCount } = await supabase
            .from('ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('feature', feature)
            .gte('created_at', todayStart.toISOString());

        const limits = RATE_LIMITS[feature] || { free: 5, premium: 50 };
        // TODO: Check if user has premium subscription
        const isPremium = false;
        const limit = isPremium ? limits.premium : limits.free;

        if ((usageCount ?? 0) >= limit) {
            return new Response(
                JSON.stringify({
                    error: 'Daily limit reached',
                    limit,
                    used: usageCount,
                    isPremium,
                }),
                { status: 429 }
            );
        }

        // 4. Build full prompt with server-side system prompt
        const systemPrompt = SYSTEM_PROMPTS[feature];
        const fullPrompt = `${systemPrompt}\n\n${context || ''}\n\n${prompt}`;

        // 5. Call Gemini API (key is server-side only)
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 500 });
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ],
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 });
        }

        const geminiData = await geminiResponse.json();
        const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // 6. Log usage (using service role for insert)
        const serviceSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await serviceSupabase.from('ai_usage').insert({
            user_id: user.id,
            feature,
            tokens_used: fullPrompt.length + aiText.length, // rough estimate
        });

        // 7. Return response
        return new Response(
            JSON.stringify({ result: aiText }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('AI Proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
});
