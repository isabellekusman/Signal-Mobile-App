import { supabase } from "../lib/supabase";
import { generateContent } from "./gemini"; // Keep for dev fallback

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
                console.error(`[AI Proxy Error] ${feature}:`, error);

                // Fallback to direct call in dev if configured
                if (__DEV__ && process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
                    console.warn(`[AI Fallback] Falling back to direct Gemini call for ${feature}`);
                    return await this.fallbackDirectCall(feature, prompt, context, image);
                }

                // Check for specific error status (like 429 Limit Reached)
                if (error.status === 429) {
                    throw new Error('DAILY_LIMIT_REACHED');
                }

                throw new Error(error.message || 'AI request failed');
            }

            return data.result;
        } catch (err) {
            console.error(`[AI Service Catch] ${feature}:`, err);
            throw err;
        }
    },

    /**
     * Fallback for development if Edge Function isn't deployed yet
     */
    async fallbackDirectCall(feature: string, prompt: string, context?: string, image?: { data: string, mimeType: string }): Promise<string> {
        const fullPrompt = `${context || ''}\n\n${prompt}`;
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
    }
};
