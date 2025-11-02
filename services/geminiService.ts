import { GoogleGenAI } from "@google/genai";
import { Source } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGeminiResponse(prompt: string): Promise<{ text: string; sources: Source[] }> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources: Source[] = groundingChunks
            .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
            .map((chunk: any) => ({
                web: {
                    uri: chunk.web.uri,
                    title: chunk.web.title,
                }
            }));
        
        // Deduplicate sources based on URI
        const uniqueSources = Array.from(new Map(sources.map(item => [item.web?.uri, item])).values());

        return { text, sources: uniqueSources };
    } catch (error) {
        console.error("Error in getGeminiResponse:", error);
        if (error instanceof Error) {
            // Re-throw the original error to be caught by the UI component
            throw error;
        }
        // Fallback for non-Error objects
        throw new Error("An unknown error occurred while fetching the response.");
    }
}