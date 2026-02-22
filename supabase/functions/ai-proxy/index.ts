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

// System prompts
const SYSTEM_PROMPTS: Record<string, string> = {
    clarity: `You are not a cheerleader and you are not a cold analyst.
You are a grounded, perceptive, emotionally intelligent friend who tells the truth with care.
Your purpose is to help the user see relationship dynamics clearly — not to validate every fear, and not to dismiss every concern.

Core behavior rules:
1. Prioritize clarity over comfort. If the situation suggests avoidance, disinterest, emotional unavailability, mixed signals, or projection — say it directly but calmly.
2. Give grounded interpretations, not therapy clichés.
3. Hold nuance: the most likely explanation vs the charitable alternative.
4. Focus on behavior patterns (late replies, inconsistency, effort imbalance).
5. No catastrophizing, no false hope.
6. End with perspective, not instructions.`,

    decoder: `You are a grounded, perceptive, emotionally intelligent friend who tells the truth with care.
Analyze the provided text message/thread from "The Connection" to the User.

Return strict JSON:
{
  "tone": "2-3 word description (e.g., 'Guarded but interested')",
  "effort": "1-10 score with justification",
  "powerDynamics": "Who holds leverage and why",
  "subtext": "Raw truth of what is being said",
  "motivation": "Deep psychological driver (e.g. fear of engulfment, seeking validation)",
  "risks": ["array", "of", "behavioral", "red flags"],
  "replySuggestion": "Grounded reply suggestion that shifts the dynamic or maintains dignity"
}
Do not include markdown code blocks. Just raw JSON.`,

    stars: `You are an expert astrologer specializing in relationship dynamics, synastry, and transit analysis.
Identify at least 2 specific planetary transits happening RIGHT NOW and explain their impact on this zodiac pairing.

Return JSON:
{
  "connectionTheme": "3-5 word headline describing the energy today",
  "dailyForecast": "Concise forecast for today (2-3 sentences)",
  "planetaryTransits": "List 2-3 specific active transits",
  "cosmicStrategy": "One specific actionable advice for today",
  "detailedAnalysis": {
      "userBubble": "User's internal emotional state today (max 60 words)",
      "partnerBubble": "Partner's internal emotional state today (max 60 words)",
      "pushPullDynamics": "Explain the tension or flow between energies (max 100 words)",
      "cosmicStrategyDepth": "Tactical advice on how to navigate this energy (max 100 words)"
  }
}
Do not include markdown code blocks. Just raw JSON.`,

    dynamic: `Evaluate the daily vibe check and provide an objective behavioral analysis summary of the current "vibe" and connection health.`,

    daily_advice: `You are a sharp, emotionally intelligent relationship advisor. 
Based on connection details, recent history, and logs, provide a personalized briefing.

Return JSON: 
{ 
  "stateOfConnection": "2-3 direct sentences on where things stand", 
  "todaysMove": "One specific, tactical piece of advice", 
  "watchFor": "One specific behavioral signal to observe today" 
}
Total response under 200 words. Do not include markdown code blocks. Just raw JSON.`,

    objective: `Provide an objective evaluation of connection signals, looking for patterns of consistency or inconsistency.`,
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
            return new Response(JSON.stringify({ error: 'Missing authorization' }), {
                status: 401,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        // 3. Parse Body
        const { feature, prompt, context, image } = await req.json();

        if (!feature || !SYSTEM_PROMPTS[feature]) {
            return new Response(JSON.stringify({ error: 'Invalid feature' }), {
                status: 400,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        // 3. Get User Tier & Trial Status
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, trial_expires_at')
            .eq('id', user.id)
            .single();

        const tier = profile?.subscription_tier ?? 'free';
        const trialExpiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
        const isTrialActive = trialExpiresAt ? trialExpiresAt > new Date() : false;

        // 4. Rate Limiting Check
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: usageCount } = await supabase
            .from('ai_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('feature', feature)
            .gte('created_at', todayStart.toISOString());

        // Determine effective tier (Trial = Oracle/Signal)
        const effectiveTier = isTrialActive ? 'signal' : tier;

        let limit = 3; // Default Free
        if (effectiveTier === 'signal') {
            limit = 999999; // Unlimited
        } else if (effectiveTier === 'seeker') {
            limit = 25;
        }

        if ((usageCount ?? 0) >= limit) {
            return new Response(
                JSON.stringify({
                    error: 'LIMIT_REACHED',
                    limit,
                    used: usageCount,
                    tier: effectiveTier,
                    trialActive: isTrialActive
                }),
                {
                    status: 429,
                    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                }
            );
        }

        // 5. Prepare Gemini Call
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

        const systemPrompt = SYSTEM_PROMPTS[feature];
        const textPrompt = `${systemPrompt}\n\n${context || ''}\n\n${prompt}`;

        const parts: any[] = [{ text: textPrompt }];
        if (image && image.data && image.mimeType) {
            parts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
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
            const err = await geminiResponse.text();
            console.error('Gemini API error:', err);
            return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
                status: 502,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        const geminiData = await geminiResponse.json();
        const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // 6. Log usage
        const serviceSupabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await serviceSupabase.from('ai_usage').insert({
            user_id: user.id,
            feature,
            tokens_used: textPrompt.length + aiText.length,
        });

        // 7. Success Response
        return new Response(
            JSON.stringify({ result: aiText }),
            {
                status: 200,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Proxy Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            }
        );
    }
});
