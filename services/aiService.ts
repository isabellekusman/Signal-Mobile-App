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
        const MAX_RETRIES = 2;

        const executeRequest = async (attempt: number): Promise<string> => {
            try {
                // 1) ensure there's a logged-in user (getUser forces server-side validation
                //    and auto-refreshes expired tokens, unlike getSession which reads cache)
                let activeToken: string | undefined;
                const { data: { session } } = await supabase.auth.getSession();
                activeToken = session?.access_token;

                if (!activeToken) {
                    // Session not in cache — try refreshing explicitly
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    activeToken = refreshData?.session?.access_token;
                    if (refreshError || !activeToken) {
                        throw new Error("User not authenticated");
                    }
                }

                // 2) invoke the edge function with the user's token and a timeout
                const payload = { feature, prompt, context, image };

                logger.breadcrumb(`AI Request: ${feature} (Attempt ${attempt + 1})`, 'ai', { feature });

                // We wrap the invoke in a timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout (must outlast edge function limit)

                const { data, error } = await supabase.functions.invoke("ai-proxy", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${activeToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // 3) handle SDK-level error
                if (error) {
                    // Retry on transient errors (timeout, network, 502/503 from edge function)
                    const errMsg = error.message || '';
                    const isTransient = errMsg.includes('timeout') ||
                        errMsg.includes('network') ||
                        errMsg.includes('502') ||
                        errMsg.includes('503') ||
                        errMsg.includes('GEMINI_ERROR') ||
                        errMsg.includes('FunctionsHttpError') ||
                        errMsg.includes('Failed to fetch') ||
                        errMsg.includes('INTERNAL_SERVER_ERROR');

                    if (attempt < MAX_RETRIES && isTransient) {
                        const delay = (attempt + 1) * 1500; // progressive backoff: 1.5s, 3s
                        logger.warn(`AI request failed, retrying in ${delay}ms... (Attempt ${attempt + 1})`, { extra: { error: errMsg } });
                        await new Promise(r => setTimeout(r, delay));
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

                if (attempt < MAX_RETRIES && !err.message?.includes('authenticated') && !err.message?.includes('LIMIT_REACHED')) {
                    const delay = (attempt + 1) * 1500;
                    logger.warn(`AI catch-block retry in ${delay}ms... (Attempt ${attempt + 1})`, { extra: { err: err.message } });
                    await new Promise(r => setTimeout(r, delay));
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
