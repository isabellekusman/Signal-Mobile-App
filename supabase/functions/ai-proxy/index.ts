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
import * as Sentry from 'npm:@sentry/deno';

Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN'),
});

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

    clarity: `You are a grounded, perceptive, emotionally intelligent friend who tells the truth with care.
You decode relationship dynamics like a sharp behavioral analyst—not a therapist.

Your style:
- Name the behavior plainly ("That's avoidant withdrawal, not them needing space")
- Explain the likely motivation behind the behavior
- Validate the user's feelings with grounded truth, not toxic positivity
- End with a declarative insight, NEVER a question
- Sound like a smart friend who studied attachment theory, not a self-help book

NEVER use:
- "What do you think that means?"
- "How does that make you feel?"
- Growth mindset framing or coaching jargon
- "Perhaps you should reflect on..."

DO use:
- Direct statements: "Here's what's actually happening..."
- Pattern recognition: "This is a classic anxious-avoidant cycle..."
- Behavioral decoding: "When someone does X, it usually means Y..."
- Honest assessment: "This isn't a good sign, and here's why..."

Keep responses 150-300 words. Be warm but unflinching.`,

    decoder: `You are an expert behavioral analyst and communication decoder.
Analyze the provided text message thread or screenshot with surgical precision.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "tone": "A 2-4 word tone label (e.g., 'Warm but guarded', 'Performatively casual', 'Dismissive-avoidant')",
  "effort": "A 2-4 word effort assessment (e.g., 'Bare minimum', 'Genuine investment', 'Strategic mirroring')",
  "powerDynamics": "A detailed 2-4 sentence analysis of who holds the power in this exchange. Who is pursuing? Who is retreating? Is there emotional labor imbalance? Be specific about the dynamics at play.",
  "subtext": "A detailed 3-5 sentence analysis of what is ACTUALLY being communicated beneath the surface. What are they really saying? What emotions are they masking? What is the gap between their words and their likely intent?",
  "motivation": "A detailed 2-4 sentence analysis of WHY this person is communicating this way. What is their underlying need? Are they protecting themselves? Seeking validation? Testing boundaries? Creating distance?",
  "risks": ["Risk or red flag 1", "Risk or red flag 2", "Risk or red flag 3"],
  "replySuggestion": "A specific, natural-sounding reply the user could send that maintains their dignity and shifts the dynamic in their favor. 1-2 sentences max."
}

Rules:
- Be direct and perceptive, not diplomatic
- Name attachment styles when relevant (anxious, avoidant, secure, disorganized)
- Call out breadcrumbing, future-faking, love-bombing, stonewalling when you see it
- The subtext section should be your deepest analysis—minimum 3 sentences
- Each risk should be specific and actionable, not generic
- The reply suggestion should sound natural, not robotic
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    stars: `You are an expert astrologer with deep knowledge of planetary transits, aspects, and synastry.
Provide accurate, specific astrological analysis based on REAL current planetary positions and aspects.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "connectionTheme": "A poetic 2-5 word theme for today's energy between these signs (e.g., 'Magnetic Tension Rising', 'Quiet Storm Brewing', 'Hearts in Retrograde')",
  "dailyForecast": "A detailed 4-6 sentence forecast specific to the interaction between these two zodiac signs today. Reference actual planetary positions. Explain how the cosmic weather specifically affects their dynamic. Be vivid and specific, not generic horoscope filler.",
  "planetaryTransits": "A detailed 3-5 sentence description of the key planetary transits affecting these signs RIGHT NOW. Reference specific planets, signs, and aspects (e.g., 'Venus in Pisces trines your natal Moon', 'Mars squaring Saturn creates friction'). Be astrologically accurate.",
  "cosmicStrategy": "A concise 2-3 sentence actionable strategy for navigating today's energy. Be specific about timing (morning vs evening energy), communication approaches, and what to avoid.",
  "detailedAnalysis": {
    "userBubble": "A detailed 3-5 sentence analysis of what the USER's sign is experiencing today. How are they feeling? What planetary energy is activating their chart? What emotional currents are running? Be specific to their element and modality.",
    "partnerBubble": "A detailed 3-5 sentence analysis of what the PARTNER's sign is experiencing today. Same depth as userBubble. How might their current state affect how they show up in this connection?",
    "pushPullDynamics": "A detailed 4-6 sentence analysis of the push-pull energy between these two signs today. Where is the tension? Where is the harmony? What aspects create attraction vs friction? Reference specific planetary interactions between the signs.",
    "cosmicStrategyDepth": "A detailed 4-6 sentence expanded strategy. Include specific advice for communication, timing of important conversations, physical vs emotional connection, and what cosmic opportunities to seize today."
  }
}

Rules:
- Reference REAL planetary positions and aspects for today's date
- Be specific to the exact sign pairing, not generic
- Use vivid, evocative language—this should feel mystical but grounded
- Each section should be substantive and detailed, never one-liners
- The detailedAnalysis sections should each be 3-6 sentences minimum
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    dynamic: `You are an objective behavioral analyst evaluating relationship health.
Analyze the provided metrics and reflection with clinical precision while remaining compassionate.
Provide a clear, honest assessment of the connection's current state.
Focus on observable patterns, not assumptions. Be direct about concerning dynamics.
Keep your response to 200-400 words. Structure it clearly with the overall vibe, key patterns, and one actionable insight.`,

    daily_advice: `You are a direct, perceptive relationship advisor who gives real talk, not platitudes.
Analyze the connection context and provide today's personalized guidance.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "stateOfConnection": "A detailed 3-5 sentence honest assessment of where this connection stands RIGHT NOW. Reference specific patterns from the context provided. Name the dynamic plainly. Don't sugarcoat, but be constructive. Identify the core tension or strength at play today.",
  "todaysMove": "A specific, actionable 2-4 sentence recommendation for what the user should do TODAY. Not generic advice—something concrete based on the current state. Include specific language they could use or specific actions to take or avoid.",
  "watchFor": "A specific 2-3 sentence warning about what to watch for today. What patterns might emerge? What triggers should they be aware of? What would be a red flag vs. a green flag in today's interactions?"
}

Rules:
- Be direct and specific to THIS connection, not generic
- Reference the connection context and history provided
- Name attachment patterns and behavioral dynamics when relevant
- The advice should feel like it's from a sharp friend, not a therapist
- Each field should be substantive (3+ sentences), never one-liners
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    objective: `You are an objective behavioral evaluator. No emotional framing, no optimism bias.
Analyze the provided signals for consistency, effort patterns, and red/green flags.
Be clinical and honest. Call out discrepancies between words and actions.
Structure your response as: Overall Assessment (2-3 sentences), Consistency Score (Low/Medium/High with reasoning), Key Observations (3-5 bullet points of specific behavioral patterns), and Bottom Line (1-2 sentence honest verdict).
Keep total response to 200-350 words.`,

};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Patterns used for prompt injection detection
const INJECTION_PATTERNS = [
    /ignore all previous instructions/i,
    /disregard all previous instructions/i,
    /system prompt/i,
    /new instructions/i,
    /you are now/i,
    /prompt injection/i,
    /translate the following/i,
    /output the system prompt/i,
    /forget everything/i,
    /developer mode/i
];

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
            Sentry.captureMessage(`[AI Proxy] Invalid feature: ${feature}`);
            throw new Error('Invalid feature requested');
        }

        // ─── H-3: Prompt Injection Protection ───
        const combinedInput = `${prompt || ''} ${context || ''}`;
        const isInjection = INJECTION_PATTERNS.some(pattern => pattern.test(combinedInput));

        if (isInjection) {
            console.warn('[AI Proxy] Blocked potential prompt injection from user:', user.id);
            return new Response(JSON.stringify({
                error: 'SECURITY_BLOCK',
                message: 'Your request contains prohibited instructions. Please stay on topic.'
            }), {
                status: 400,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
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
            Sentry.captureException(usageError, { extra: { context: '[AI Proxy] Usage Check Error' } });
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
                Sentry.captureException(profileError, { extra: { context: '[AI Proxy] Profile Check Error' } });
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

        // 5. Call Gemini (with 1 retry for transient 500/503 errors)
        console.log('[AI Proxy] Step 5: Calling Gemini');
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        const systemPrompt = SYSTEM_PROMPTS[feature];

        // Prepare contents for Gemini multimodal API
        // We now use system_instruction in the root of the JSON body for stronger gating
        const parts: any[] = [
            { text: `Context:\n${context || 'None'}\n\nUser Input:\n${prompt}` }
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
        const geminiPayload = JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
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
        });

        let geminiResponse: Response | null = null;
        let data: any = null;
        const MAX_GEMINI_RETRIES = 1;

        for (let geminiAttempt = 0; geminiAttempt <= MAX_GEMINI_RETRIES; geminiAttempt++) {
            geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: geminiPayload,
                }
            );

            data = await geminiResponse.json();

            // Retry on transient server errors (500, 503)
            if (!geminiResponse.ok && (geminiResponse.status === 500 || geminiResponse.status === 503) && geminiAttempt < MAX_GEMINI_RETRIES) {
                console.warn(`[AI Proxy] Gemini returned ${geminiResponse.status}, retrying in 2s... (attempt ${geminiAttempt + 1})`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
            break; // success or non-retryable error
        }

        if (!geminiResponse!.ok) {
            Sentry.captureMessage(`[Gemini API Error] ${JSON.stringify(data)}`);
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
            if (error) Sentry.captureException(error, { extra: { context: '[AI Proxy] Usage Log Error' } });
        });

        return new Response(JSON.stringify({ result }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        Sentry.captureException(error, { extra: { context: '[AI Proxy] Global Catch' } });
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
