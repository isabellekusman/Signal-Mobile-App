import { supabase } from "../lib/supabase";
import { generateContent } from "./gemini";

// Prompts for development fallback (when Edge Functions are not yet deployed)
const FALLBACK_PROMPTS: Record<string, string> = {
    clarity: `You are a grounded, perceptive, emotionally intelligent friend. Help the user see relationship dynamics clearly. Prioritize clarity over comfort.`,

    decoder: `Analyze text/thread. You MUST return ONLY a JSON object with this structure: { "tone": "string", "effort": "string", "powerDynamics": "string", "subtext": "string", "motivation": "string", "risks": [], "replySuggestion": "string" }. Do not add any conversational text before or after the JSON.`,

    stars: `Relationship astrologer. Return ONLY a JSON object: { "connectionTheme": "string", "dailyForecast": "string", "planetaryTransits": "string", "cosmicStrategy": "string", "detailedAnalysis": { "userBubble": "string", "partnerBubble": "string", "pushPullDynamics": "string", "cosmicStrategyDepth": "string" } }`,

    dynamic: `Evaluate vibe check and provide objective behavioral analysis.`,

    daily_advice: `Relationship advisor. Return ONLY a JSON object: { "stateOfConnection": "string", "todaysMove": "string", "watchFor": "string" }. Ensure it is valid JSON with no conversational text.`,

    objective: `Objective evaluation of connection signals.`
};

/**
 * AI Service
 * 
 * Securely proxies AI requests through Supabase Edge Functions.
 * This prevents API key exposure and allows for server-side rate limiting.
 */
export const aiService = {
    /**
     * Helper to call the Supabase AI Proxy
     */
    async callProxy(feature: string, prompt: string, context?: string, image?: { data: string, mimeType: string }): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-proxy', {
                body: { feature, prompt, context, image }
            });

            if (error) {
                // If in dev and we have a fallback, use warn instead of error to avoid LogBox popup
                if (__DEV__ && process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
                    console.warn(`[AI Proxy Error] ${feature} (Falling back):`, error);
                    return await this.fallbackDirectCall(feature, prompt, context, image);
                }

                console.error(`[AI Proxy Error] ${feature}:`, error);
                if (error.status === 429) throw new Error('DAILY_LIMIT_REACHED');
                throw new Error(error.message || 'AI request failed');
            }

            return data.result;
        } catch (err) {
            console.error(`[AI Service Catch] ${feature}:`, err);

            // Even if the invoke itself throws (network error, function not found), try fallback in dev
            if (__DEV__ && process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
                console.warn(`[AI Fallback] Falling back from catch for ${feature}`);
                return await this.fallbackDirectCall(feature, prompt, context, image);
            }
            throw err;
        }
    },

    /**
     * Fallback for development if Edge Function isn't deployed yet
     */
    async fallbackDirectCall(feature: string, prompt: string, context?: string, image?: { data: string, mimeType: string }): Promise<string> {
        const systemPrompt = FALLBACK_PROMPTS[feature] || '';
        const fullPrompt = `System: ${systemPrompt}\n\nContext: ${context || ''}\n\nUser: ${prompt}`;

        if (image) {
            const imagePart = {
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            };
            return await generateContent([fullPrompt, imagePart]);
        }
        return await generateContent(fullPrompt);
    },

    /**
     * Parse the signal from the noise based on user input.
     */
    async getClarityInsight(userInput: string, connectionContext?: string, history?: string) {
        const context = `Connection Context: ${connectionContext || 'General'}${history ? `\n\nRecent History:\n${history}` : ''}`;
        return await this.callProxy('clarity', `Current Observation/Message: ${userInput}`, context);
    },

    /**
     * Decode the subtext of a text thread.
     */
    async decodeMessage(textThread: string, name?: string) {
        const context = `Connection Name: ${name || 'Unknown'}`;
        return await this.callProxy('decoder', `Text Thread:\n${textThread}`, context);
    },

    /**
     * Decode a screenshot of a conversation.
     */
    async decodeImageMessage(imageBase64: string, mimeType: string, textThread?: string, name?: string) {
        const prompt = `Connection Name: ${name || 'Unknown'}\n\nAdditional Context (if any):\n${textThread || ''}`;
        const image = { data: imageBase64, mimeType };
        return await this.callProxy('decoder', prompt, undefined, image);
    },

    /**
     * Get a relationship forecast based on zodiac signs.
     */
    async getStarsAlign(name: string, userZodiac: string, partnerZodiac: string) {
        const prompt = `Today's Date: ${new Date().toDateString()}\nUser Zodiac: ${userZodiac}\nPartner (${name}) Zodiac: ${partnerZodiac}`;
        return await this.callProxy('stars', prompt);
    },

    /**
     * Analyze the vibe from a daily check-in.
     */
    async analyzeDynamicVibe(metrics: { safety: number, clarity: number, excitement: number, regulation: number }, reflection: string) {
        const prompt = `Metrics: ${JSON.stringify(metrics)}\nUser Reflection: ${reflection}`;
        return await this.callProxy('dynamic', prompt);
    },

    /**
     * Objective check-in for the overall connection health.
     */
    async getObjectiveCheckIn(signals: any[]) {
        const prompt = `Signals Observed: ${JSON.stringify(signals)}`;
        return await this.callProxy('objective', prompt);
    },

    /**
     * Get personalized daily advice for a specific connection.
     */
    async getDailyAdvice(name: string, tag: string, zodiac: string, context: string) {
        const prompt = `Connection Name: ${name}\nConnection Type: ${tag}\nZodiac Sign: ${zodiac}\nToday's Date: ${new Date().toDateString()}\n\nContext & History:\n${context}`;
        return await this.callProxy('daily_advice', prompt);
    },

    /**
     * Extracts JSON from a string that might contain other text
     */
    safeParseJSON(text: string) {
        try {
            // Try direct parse first
            return JSON.parse(text.trim());
        } catch (e) {
            // Try to find JSON between triple backticks
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match && match[1]) {
                try {
                    return JSON.parse(match[1].trim());
                } catch (e2) { /* continue */ }
            }

            // Fallback: search for first '{' and last '}'
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                try {
                    return JSON.parse(text.substring(start, end + 1));
                } catch (e3) { /* continue */ }
            }
            throw new Error("Could not parse AI response as JSON");
        }
    }
};
