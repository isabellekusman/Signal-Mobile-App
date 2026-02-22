import { supabase } from "../lib/supabase";

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
        try {
            // 1) ensure there's a logged-in user
            const { data: { session } } = await supabase.auth.getSession();
            console.log("SESSION TOKEN:", session?.access_token ?? "NULL");
            if (!session?.access_token) {
                throw new Error("User not authenticated");
            }

            // 2) invoke the edge function with the user's token
            const payload = { feature, prompt, context, image };

            const { data, error } = await supabase.functions.invoke("ai-proxy", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            // 3) handle SDK-level error
            if (error) {
                console.error("[AI Service] function error:", error);
                throw error;
            }

            // 4) Normalize return
            if (typeof data === "string") return data;
            if (data == null) return "";

            if ((data as any).result?.output) return JSON.stringify((data as any).result.output);
            if ((data as any).result) return typeof (data as any).result === 'string' ? (data as any).result : JSON.stringify((data as any).result);
            return JSON.stringify(data);

        } catch (err) {
            console.error("[AI Service] callProxy error:", err);
            throw err;
        }
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
            const end = text.lastIndexAt('}');
            if (start !== -1 && end !== -1 && end > start) {
                try {
                    return JSON.parse(text.substring(start, end + 1));
                } catch (e3) { /* continue */ }
            }
            throw new Error("Could not parse AI response as JSON");
        }
    }
};
