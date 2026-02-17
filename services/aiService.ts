import { generateContent } from "./gemini";
import * as Prompts from "./prompts";

export const aiService = {
    /**
     * Parse the signal from the noise based on user input.
     */
    async getClarityInsight(userInput: string, connectionContext?: string) {
        const fullPrompt = `${Prompts.CLARITY_PROMPT}\n\nConnection Context: ${connectionContext || 'General'}\nUser Observation: ${userInput}`;
        return await generateContent(fullPrompt);
    },

    /**
     * Decode the subtext of a text thread.
     */
    async decodeMessage(textThread: string) {
        const fullPrompt = `${Prompts.DECODER_PROMPT}\n\nText Thread:\n${textThread}`;
        return await generateContent(fullPrompt);
    },

    /**
     * Get a relationship forecast based on zodiac signs.
     */
    async getStarsAlign(name: string, userZodiac: string, partnerZodiac: string) {
        const fullPrompt = `${Prompts.STARS_PROMPT}\n\nUser Zodiac: ${userZodiac}\nPartner (${name}) Zodiac: ${partnerZodiac}`;
        return await generateContent(fullPrompt);
    },

    /**
     * Analyze the vibe from a daily check-in.
     */
    async analyzeDynamicVibe(metrics: { safety: number, clarity: number, excitement: number, regulation: number }, reflection: string) {
        const fullPrompt = `${Prompts.DYNAMIC_PROMPT}\n\nMetrics: ${JSON.stringify(metrics)}\nUser Reflection: ${reflection}`;
        return await generateContent(fullPrompt);
    },

    /**
     * Objective check-in for the overall connection health.
     */
    async getObjectiveCheckIn(signals: any[]) {
        const fullPrompt = `${Prompts.OBJECTIVE_CHECKIN_PROMPT}\n\nSignals Observed: ${JSON.stringify(signals)}`;
        return await generateContent(fullPrompt);
    }
};
