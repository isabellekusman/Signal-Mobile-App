import { supabase } from "../lib/supabase";
import { logger } from './logger';

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
    async callProxy(
        feature: string,
        prompt: string,
        context?: string,
        image?: { data: string; mimeType: string }
    ): Promise<string> {
        const MAX_RETRIES = 1;

        const executeRequest = async (attempt: number): Promise<string> => {
            try {
                // 1) ensure there's a logged-in user
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error("User not authenticated");
                }

                // 2) invoke the edge function with the user's token and a timeout
                const payload = { feature, prompt, context, image };

                logger.breadcrumb(`AI Request: ${feature} (Attempt ${attempt + 1})`, 'ai', { feature });

                // We wrap the invoke in a timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

                const { data, error } = await supabase.functions.invoke("ai-proxy", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // 3) handle SDK-level error
                if (error) {
                    // If it's a transient error or rate limit, we might want to retry, but usually rate limits shouldn't be retried
                    if (attempt < MAX_RETRIES && (error.message?.includes('timeout') || error.message?.includes('network'))) {
                        logger.warn(`AI request failed, retrying... (Attempt ${attempt + 1})`, { extra: { error: error.message } });
                        return executeRequest(attempt + 1);
                    }

                    logger.error(error, { tags: { service: 'ai', method: 'callProxy' }, extra: { feature, attempt } });

                    if (error.context) {
                        try {
                            const body = await error.context.json();
                            throw new Error(body.message || body.error || error.message);
                        } catch (e) {
                            // ignore parse error, throw original
                        }
                    }
                    throw error;
                }

                // 4) Normalize return
                if (typeof data === "string") return data;
                if (data == null) return "";

                const result = (data as any).result;
                if (result?.output) return typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
                if (result) return typeof result === 'string' ? result : JSON.stringify(result);

                return JSON.stringify(data);

            } catch (err: any) {
                if (err.name === 'AbortError') {
                    logger.warn('AI request timed out', { tags: { feature } });
                    throw new Error("Request timed out. Please try again.");
                }

                if (attempt < MAX_RETRIES && !err.message?.includes('authenticated')) {
                    logger.warn(`AI catch-block retry... (Attempt ${attempt + 1})`, { extra: { err: err.message } });
                    return executeRequest(attempt + 1);
                }

                logger.error(err, { tags: { service: 'ai', method: 'callProxy' }, extra: { feature, attempt } });
                throw err;
            }
        };

        return executeRequest(0);
    },

    async getClarityInsight(userInput: string, connectionContext?: string, history?: string) {
        const context = `Connection Context: ${connectionContext || 'General'}${history ? `\n\nRecent History:\n${history}` : ''}`;
        return await this.callProxy('clarity', `Current Observation/Message: ${userInput}`, context);
    },

    async decodeMessage(textThread: string, name?: string) {
        const context = `Connection Name: ${name || 'Unknown'}`;
        return await this.callProxy('decoder', `Text Thread:\n${textThread}`, context);
    },

    async decodeImageMessage(imageBase64: string, mimeType: string, textThread?: string, name?: string) {
        const prompt = `Connection Name: ${name || 'Unknown'}\n\nAdditional Context (if any):\n${textThread || ''}`;
        const image = { data: imageBase64, mimeType };
        return await this.callProxy('decoder', prompt, undefined, image);
    },

    async getStarsAlign(name: string, userZodiac: string, partnerZodiac: string) {
        const prompt = `Today's Date: ${new Date().toDateString()}\nUser Zodiac: ${userZodiac}\nPartner (${name}) Zodiac: ${partnerZodiac}`;
        return await this.callProxy('stars', prompt);
    },

    async analyzeDynamicVibe(metrics: { safety: number, clarity: number, excitement: number, regulation: number }, reflection: string) {
        const prompt = `Metrics: ${JSON.stringify(metrics)}\nUser Reflection: ${reflection}`;
        return await this.callProxy('dynamic', prompt);
    },

    async getObjectiveCheckIn(signals: any[]) {
        const prompt = `Signals Observed: ${JSON.stringify(signals)}`;
        return await this.callProxy('objective', prompt);
    },

    async getDailyAdvice(name: string, tag: string, zodiac: string, context: string) {
        const prompt = `Connection Name: ${name}\nConnection Type: ${tag}\nZodiac Sign: ${zodiac}\nToday's Date: ${new Date().toDateString()}\n\nContext & History:\n${context}`;
        return await this.callProxy('daily_advice', prompt);
    },

    safeParseJSON(text: string) {
        try {
            return JSON.parse(text.trim());
        } catch (e) {
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match && match[1]) {
                try {
                    return JSON.parse(match[1].trim());
                } catch (e2) { /* continue */ }
            }

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
