import { generateContent } from "./gemini";
import * as Prompts from "./prompts";

export const aiService = {
    /**
     * Parse the signal from the noise based on user input.
     */
    async getClarityInsight(userInput: string, connectionContext?: string, history?: string) {
        let fullPrompt = `${Prompts.CLARITY_PROMPT}\n\nConnection Context: ${connectionContext || 'General'}`;
        if (history) {
            fullPrompt += `\n\nRecent Conversation History:\n${history}`;
        }
        fullPrompt += `\n\nCurrent Observation/Message: ${userInput}`;
        return await generateContent(fullPrompt);
    },

    /**
     * Decode the subtext of a text thread.
     */
    async decodeMessage(textThread: string, name?: string) {
        const fullPrompt = `${Prompts.DECODER_PROMPT}\n\nConnection Name: ${name || 'Unknown'}\n\nText Thread:\n${textThread}`;
        return await generateContent(fullPrompt);
    },

    /**
     * Decode a screenshot of a conversation.
     */
    async decodeImageMessage(imageBase64: string, mimeType: string, textThread?: string, name?: string) {
        const promptText = `${Prompts.DECODER_PROMPT}\n\nConnection Name: ${name || 'Unknown'}\n\nAdditional Context (if any):\n${textThread || ''}\n\n[Attached Image of Conversation]`;
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType
            }
        };
        return await generateContent([promptText, imagePart]);
    },

    /**
     * Get a relationship forecast based on zodiac signs.
     */
    async getStarsAlign(name: string, userZodiac: string, partnerZodiac: string) {
        const fullPrompt = `${Prompts.STARS_ALIGN_PROMPT}\n\nToday's Date: ${new Date().toDateString()}\nUser Zodiac: ${userZodiac}\nPartner (${name}) Zodiac: ${partnerZodiac}`;
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
