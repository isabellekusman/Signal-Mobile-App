import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not set in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);

if (API_KEY) {
    console.log(`Gemini Service Initialized with Key: ${API_KEY.substring(0, 5)}...`);
} else {
    console.error("Gemini Service: No API Key found!");
}

export const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

export async function generateContent(prompt: string | Array<string | any>) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
