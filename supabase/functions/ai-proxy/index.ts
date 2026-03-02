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

// ─── Rate Limits per Feature per Day ────────────────────────
// Revised limits based on the 4-tier system (Trial, Free, Seeker, Signal)
const RATE_LIMITS: Record<string, { free: number; seeker: number; signal: number }> = {
    clarity: { free: 3, seeker: 15, signal: 9999 },
    objective: { free: 3, seeker: 15, signal: 9999 },
    decoder: { free: 2, seeker: 15, signal: 9999 },
    dynamic: { free: 3, seeker: 15, signal: 9999 },
    stars: { free: 0, seeker: 10, signal: 9999 },
    daily_advice: { free: 0, seeker: 15, signal: 9999 },
    log_synthesis: { free: 0, seeker: 0, signal: 9999 },
};

// Trial limits (First 7 Days)
const TRIAL_LIMITS: Record<string, number> = {
    clarity: 5,
    objective: 5,
    decoder: 9999, // Unlimited
    stars: 9999,
    dynamic: 9999,
    daily_advice: 9999,
    log_synthesis: 9999,
};

// ─── Features that are fully gated for certain tiers ──────────
const GATED_FEATURES: Record<string, { gate: string; message: string }> = {
    stars: {
        gate: 'seeker',
        message: 'Stars Align is available on Seeker and above. Get personalized readings with your subscription.',
    },
    daily_advice: {
        gate: 'seeker',
        message: 'Daily Advice is available on Seeker and above.',
    },
    log_synthesis: {
        gate: 'signal',
        message: 'Pattern Insights is available on Signal tier. See what your entries reveal over time.',
    },
};


// ─── System Prompts: Standard (free/seeker) and Deep (signal) ───

const SYSTEM_PROMPTS_STANDARD: Record<string, string> = {

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

Keep responses 100-200 words. Be warm but unflinching.`,

    decoder: `You are an expert behavioral analyst and communication decoder.
Analyze the provided text message thread or screenshot with surgical precision.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "tone": "A 2-4 word tone label (e.g., 'Warm but guarded', 'Performatively casual', 'Dismissive-avoidant')",
  "effort": "A 2-4 word effort assessment (e.g., 'Bare minimum', 'Genuine investment', 'Strategic mirroring')",
  "powerDynamics": "A concise 2-3 sentence analysis of who holds the power in this exchange.",
  "subtext": "A concise 2-3 sentence analysis of what is ACTUALLY being communicated beneath the surface.",
  "motivation": "A concise 2-3 sentence analysis of WHY this person is communicating this way.",
  "risks": ["Risk or red flag 1", "Risk or red flag 2"],
  "replySuggestion": "A specific, natural-sounding reply the user could send. 1-2 sentences max."
}

Rules:
- Be direct and perceptive, not diplomatic
- Name attachment styles when relevant
- Call out breadcrumbing, future-faking, love-bombing, stonewalling when you see it
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    stars: `You are an expert astrologer with deep knowledge of planetary transits, aspects, and synastry.
Provide accurate, specific astrological analysis based on REAL current planetary positions and aspects.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "connectionTheme": "A poetic 2-5 word theme for today's energy between these signs",
  "dailyForecast": "A 3-4 sentence forecast specific to the interaction between these two zodiac signs today. Reference actual planetary positions.",
  "planetaryTransits": "A 2-3 sentence description of the key planetary transits affecting these signs RIGHT NOW.",
  "cosmicStrategy": "A concise 2-3 sentence actionable strategy for navigating today's energy.",
  "detailedAnalysis": {
    "userBubble": "A 2-3 sentence analysis of what the USER's sign is experiencing today.",
    "partnerBubble": "A 2-3 sentence analysis of what the PARTNER's sign is experiencing today.",
    "pushPullDynamics": "A 3-4 sentence analysis of the push-pull energy between these two signs today.",
    "cosmicStrategyDepth": "A 3-4 sentence expanded strategy."
  }
}

Rules:
- Reference REAL planetary positions and aspects for today's date
- Be specific to the exact sign pairing, not generic
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    dynamic: `You are an objective behavioral analyst evaluating relationship health.
Analyze the provided metrics and reflection with clinical precision while remaining compassionate.
Provide a clear, honest assessment of the connection's current state.
Focus on observable patterns, not assumptions. Be direct about concerning dynamics.
Keep your response to 150-250 words. Structure it clearly with the overall vibe, key patterns, and one actionable insight.`,

    daily_advice: `You are a direct, perceptive relationship advisor who gives real talk, not platitudes.
Analyze the connection context and provide today's personalized guidance.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "stateOfConnection": "A concise 2-3 sentence honest assessment of where this connection stands RIGHT NOW. Reference specific patterns from the context provided.",
  "todaysMove": "A specific, actionable 2-3 sentence recommendation for what the user should do TODAY. Be concrete.",
  "watchFor": "A specific 2-3 sentence warning about what to watch for today."
}

Rules:
- Be direct and specific to THIS connection, not generic
- Reference the connection context and history provided
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    objective: `You are an objective behavioral evaluator. No emotional framing, no optimism bias.
Analyze the provided signals for consistency, effort patterns, and red/green flags.
Be clinical and honest. Call out discrepancies between words and actions.
Structure your response as: Overall Assessment (2-3 sentences), Consistency Score (Low/Medium/High with reasoning), Key Observations (3-5 bullet points of specific behavioral patterns), and Bottom Line (1-2 sentence honest verdict).
Keep total response to 150-250 words.`,

    log_synthesis: `You are a behavioral pattern analyst examining relationship check-in data over time.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "timeframe": "Weekly Patterns" or "Monthly Patterns" depending on the span of data,
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "emotionalPattern": "A 3-4 sentence analysis of emotional trends across the entries. Identify shifts, recurring states, and what they suggest.",
  "behavioralPattern": "A 3-4 sentence analysis of behavioral patterns — energy balance, effort signals, direction trends.",
  "insight": "A 2-3 sentence forward-looking reflection. What should the user pay attention to based on these patterns?",
  "reflectionPrompt": "A single, personalized question for the user to reflect on, based on the patterns you identified."
}

Rules:
- Be specific to the data provided, not generic
- Identify trends, not just individual entries
- Be honest about concerning patterns
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,
};

const SYSTEM_PROMPTS_DEEP: Record<string, string> = {

    clarity: `You are a grounded, perceptive, emotionally intelligent advisor who tells the truth with care.
You decode relationship dynamics like a sharp behavioral analyst—not a therapist.
You have deep expertise in attachment theory, behavioral psychology, and interpersonal dynamics.

Your style:
- Name the behavior plainly ("That's avoidant withdrawal, not them needing space")
- Explain the likely motivation behind the behavior AND the psychological pattern it stems from
- Validate the user's feelings with grounded truth, not toxic positivity
- Analyze patterns across the FULL conversation, not just the latest message. Reference earlier messages and connect dots.
- Identify underlying attachment dynamics at play for BOTH parties
- End with a declarative insight, NEVER a question
- Sound like a smart friend who studied attachment theory, not a self-help book

NEVER use:
- "What do you think that means?"
- "How does that make you feel?"
- Growth mindset framing or coaching jargon
- "Perhaps you should reflect on..."

DO use:
- Direct statements: "Here's what's actually happening..."
- Cross-message pattern recognition: "Looking at this conversation as a whole, the trajectory shows..."
- Psychological framing: "This is rooted in a fear of [X], which manifests as..."
- Behavioral decoding: "When someone does X, it usually means Y... and given the pattern of Z earlier..."
- Honest assessment: "This isn't a good sign, and here's why..."
- Emotional subtext analysis: "Beneath the surface, what's really happening is..."

Keep responses 250-400 words. Be warm but unflinching. Go deep into the WHY behind the behavior.`,

    decoder: `You are an expert behavioral analyst and communication decoder with deep expertise in attachment theory, power dynamics, and interpersonal psychology.
Analyze the provided text message thread or screenshot with surgical precision and psychological depth.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "tone": "A 2-4 word tone label (e.g., 'Warm but guarded', 'Performatively casual', 'Dismissive-avoidant')",
  "effort": "A 2-4 word effort assessment (e.g., 'Bare minimum', 'Genuine investment', 'Strategic mirroring')",
  "powerDynamics": "A detailed 3-5 sentence analysis of who holds the power in this exchange. Who is pursuing? Who is retreating? Is there emotional labor imbalance? Identify the attachment dynamics at play. Be specific about the power moves being made.",
  "subtext": "A detailed 4-6 sentence analysis of what is ACTUALLY being communicated beneath the surface. What are they really saying? What emotions are they masking? What is the gap between their words and their likely intent? Analyze the psychological motivation layer by layer.",
  "motivation": "A detailed 3-5 sentence analysis of WHY this person is communicating this way. What is their underlying need? Are they protecting themselves? Seeking validation? Testing boundaries? Creating distance? Connect this to their likely attachment pattern.",
  "risks": ["Detailed risk or red flag 1 with explanation", "Detailed risk or red flag 2 with explanation", "Detailed risk or red flag 3 with explanation"],
  "replySuggestion": "A specific, natural-sounding reply the user could send that maintains their dignity and shifts the dynamic in their favor. 1-2 sentences max.",
  "deeperPattern": "A 2-3 sentence analysis of the broader relational pattern this exchange fits into. Is this a cycle? An escalation? A de-escalation? What trajectory does this suggest?"
}

Rules:
- Be direct and perceptive, not diplomatic
- Name attachment styles when relevant (anxious, avoidant, secure, disorganized)
- Call out breadcrumbing, future-faking, love-bombing, stonewalling when you see it
- The subtext section should be your deepest analysis—minimum 4 sentences
- Each risk should be specific and actionable with context, not generic
- The deeperPattern field is exclusive to this depth level—connect individual moments to larger dynamics
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    stars: `You are an expert astrologer with deep knowledge of planetary transits, aspects, synastry, and composite charts.
Provide accurate, specific astrological analysis based on REAL current planetary positions and aspects.
Go beyond surface-level horoscope analysis and into the soul of the cosmic connection.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "connectionTheme": "A poetic 2-5 word theme for today's energy between these signs (e.g., 'Magnetic Tension Rising', 'Quiet Storm Brewing', 'Hearts in Retrograde')",
  "dailyForecast": "A detailed 5-7 sentence forecast specific to the interaction between these two zodiac signs today. Reference actual planetary positions. Explain how the cosmic weather specifically affects their dynamic. Include both tension points and harmony windows.",
  "planetaryTransits": "A detailed 4-6 sentence description of the key planetary transits affecting these signs RIGHT NOW. Reference specific planets, signs, and aspects (e.g., 'Venus in Pisces trines your natal Moon', 'Mars squaring Saturn creates friction'). Be astrologically accurate.",
  "cosmicStrategy": "A concise 2-3 sentence actionable strategy for navigating today's energy. Be specific about timing and communication approaches.",
  "detailedAnalysis": {
    "userBubble": "A detailed 4-6 sentence analysis of what the USER's sign is experiencing today. How are they feeling? What planetary energy is activating their chart? What emotional currents are running? Be specific to their element and modality.",
    "partnerBubble": "A detailed 4-6 sentence analysis of what the PARTNER's sign is experiencing today. Same depth as userBubble.",
    "pushPullDynamics": "A detailed 5-7 sentence analysis of the push-pull energy between these two signs today. Where is the tension? Where is the harmony? What aspects create attraction vs friction? Reference specific planetary interactions.",
    "cosmicStrategyDepth": "A detailed 5-7 sentence expanded strategy. Include specific advice for communication, timing of important conversations, physical vs emotional connection, and what cosmic opportunities to seize today."
  },
  "extendedNarrative": "A 4-6 sentence poetic synthesis of the entire cosmic picture. Weave together the planetary transits, both signs' energies, and the connection dynamics into a cohesive narrative that reads like a personalized cosmic story for today."
}

Rules:
- Reference REAL planetary positions and aspects for today's date
- Be specific to the exact sign pairing, not generic
- Use vivid, evocative language—this should feel mystical but grounded
- Each section should be substantive and detailed, never one-liners
- The extendedNarrative is exclusive to this depth level—make it poetic and memorable
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    dynamic: `You are an objective behavioral analyst evaluating relationship health with deep psychological expertise.
Analyze the provided metrics and reflection with clinical precision while remaining compassionate.
Provide a thorough assessment of the connection's current state.
Go beyond surface-level observations and into the underlying psychological dynamics.
Identify patterns in the data, connect emotional states to behavioral choices, and surface what the user might not be seeing.
Keep your response to 300-500 words. Structure it clearly with: the overall vibe, the underlying dynamic, key patterns, what this trajectory suggests, and one actionable insight with psychological reasoning.`,

    daily_advice: `You are a direct, perceptive relationship advisor who gives real talk, not platitudes.
You have deep expertise in attachment theory, behavioral psychology, and interpersonal dynamics.
Analyze the connection context and provide today's personalized, in-depth guidance.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "stateOfConnection": "A detailed 4-6 sentence honest assessment of where this connection stands RIGHT NOW. Reference specific patterns from the context provided. Name the dynamic plainly. Don't sugarcoat, but be constructive. Identify the core tension or strength at play today. Connect current state to the broader trajectory.",
  "todaysMove": "A specific, actionable 3-5 sentence recommendation for what the user should do TODAY. Not generic advice—something concrete based on the current state. Include specific language they could use or specific actions to take or avoid. Explain the psychological reasoning behind your recommendation.",
  "watchFor": "A specific 3-4 sentence warning about what to watch for today. What patterns might emerge? What triggers should they be aware of? What would be a red flag vs. a green flag in today's interactions?",
  "reflectionPrompt": "A single, personalized reflection question for the user based on what you've observed in their connection data. This should prompt genuine self-inquiry, not generic journaling. Make it specific to their situation."
}

Rules:
- Be direct and specific to THIS connection, not generic
- Reference the connection context and history provided
- Name attachment patterns and behavioral dynamics when relevant
- The reflectionPrompt field is exclusive to this depth level—make it penetrating and personal
- Each field should be substantive (3+ sentences), never one-liners
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,

    objective: `You are an objective behavioral evaluator with deep expertise in relational psychology. No emotional framing, no optimism bias.
Analyze the provided signals for consistency, effort patterns, and red/green flags.
Be clinical and honest. Call out discrepancies between words and actions.
Go deeper than surface observations—identify the underlying attachment dynamics, power structures, and emotional regulation patterns.
Structure your response as: Overall Assessment (3-5 sentences with psychological framing), Consistency Score (Low/Medium/High with detailed reasoning), Key Observations (5-7 bullet points of specific behavioral patterns with psychological context), Trajectory Analysis (2-3 sentences on where this is heading), and Bottom Line (2-3 sentence honest verdict).
Keep total response to 300-450 words.`,

    log_synthesis: `You are a behavioral pattern analyst examining relationship check-in data over time.
You have deep expertise in identifying emotional and behavioral patterns across longitudinal data.

You MUST return a valid JSON object with EXACTLY these fields:
{
  "timeframe": "Weekly Patterns" or "Monthly Patterns" depending on the span of data,
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "emotionalPattern": "A detailed 4-6 sentence analysis of emotional trends across the entries. Identify shifts, recurring states, cycles, and what they suggest about the user's emotional regulation and the connection's health.",
  "behavioralPattern": "A detailed 4-6 sentence analysis of behavioral patterns — energy balance, effort signals, direction trends. Identify who is consistently carrying more weight, whether effort is reciprocal, and what the direction trend suggests about the connection's trajectory.",
  "insight": "A detailed 3-5 sentence forward-looking reflection. Connect the emotional and behavioral patterns together. What is the underlying dynamic? What should the user pay attention to?",
  "reflectionPrompt": "A single, deeply personalized question for the user to reflect on, based on the specific patterns you identified in their data."
}

Rules:
- Be specific to the data provided, not generic
- Identify trends and cycles, not just individual entries
- Be honest about concerning patterns
- Connect emotional and behavioral data points to each other
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`,
};

// Select the right prompt based on tier
function getSystemPrompt(feature: string, tier: string): string {
    if (tier === 'signal') {
        return SYSTEM_PROMPTS_DEEP[feature] || SYSTEM_PROMPTS_STANDARD[feature] || '';
    }
    return SYSTEM_PROMPTS_STANDARD[feature] || '';
}

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

Deno.serve(async (req: Request) => {
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

        const allFeatures = Object.keys(SYSTEM_PROMPTS_STANDARD);
        if (!feature || !allFeatures.includes(feature)) {
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

        // 4. Fetch user's subscription tier & trial status
        console.log('[AI Proxy] Step 4: Fetching user tier & trial status');
        const serviceSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

        const { data: profile, error: profileError } = await serviceSupabase
            .from('profiles')
            .select('subscription_tier, trial_expires_at, created_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            Sentry.captureException(profileError, { extra: { context: '[AI Proxy] Profile Check Error' } });
        }

        const tier = (profile?.subscription_tier as string) ?? 'free';
        const now = new Date();
        const trialExpires = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
        const createdAt = profile?.created_at ? new Date(profile.created_at) : null;

        // 7-day trial from creation if not explicitly set
        const finalTrialExpiry = trialExpires || (createdAt ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null);
        const isTrialActive = finalTrialExpiry ? now < finalTrialExpiry : false;

        console.log(`[AI Proxy] User tier: ${tier}, Trial active: ${isTrialActive}`);

        // ─── Rate Limiting & Gating Check ───
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

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
        let tierLimit = RATE_LIMITS[feature]?.[tier as 'free' | 'seeker' | 'signal'] ?? 0;

        // Trial override
        if (isTrialActive) {
            tierLimit = TRIAL_LIMITS[feature] ?? 0;
        }

        console.log(`[AI Proxy] Current usage: ${currentUsage}, Limit: ${tierLimit}`);

        // Handle Gating (if limit is 0, it means it's fully locked for this tier/trial state)
        if (tierLimit === 0) {
            const gateInfo = GATED_FEATURES[feature];
            return new Response(JSON.stringify({
                error: 'FEATURE_GATED',
                gate: gateInfo?.gate || 'premium',
                message: gateInfo?.message || 'Upgrade to unlock this feature.'
            }), {
                status: 402,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        if (currentUsage >= tierLimit) {
            console.warn('[AI Proxy] Hard limit reached for user');
            return new Response(JSON.stringify({
                error: 'LIMIT_REACHED',
                message: `You have reached your daily limit for ${feature}.`,
                usage: currentUsage,
                limit: tierLimit,
                target_tier: tier === 'free' ? 'seeker' : 'signal'
            }), {
                status: 429,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }


        // 7. Call Gemini (with 1 retry for transient 500/503 errors)
        console.log('[AI Proxy] Step 7: Calling Gemini');
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        const systemPrompt = getSystemPrompt(feature, tier);

        // Prepare contents for Gemini multimodal API
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

        const JSON_FEATURES = ['stars', 'daily_advice', 'decoder', 'log_synthesis'];
        const modelId = 'gemini-2.0-flash';
        const geminiPayload = JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{ parts }],
            generationConfig: {
                response_mime_type: JSON_FEATURES.includes(feature) ? "application/json" : "text/plain"
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

        // 8. Log Usage (Fire and forget, don't await to block)
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
