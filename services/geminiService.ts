import { GoogleGenAI } from "@google/genai";
import { Source } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGeminiResponseStream(
    prompt: string,
    onStreamUpdate: (text: string) => void
): Promise<{ sources: Source[] }> {
    try {
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const allSources: Source[] = [];

        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
                onStreamUpdate(text);
            }
            
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            if (groundingChunks.length > 0) {
                 const sourcesFromChunk: Source[] = groundingChunks
                    .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
                    .map((chunk: any) => ({
                        web: {
                            uri: chunk.web.uri,
                            title: chunk.web.title,
                        }
                    }));
                allSources.push(...sourcesFromChunk);
            }
        }
        
        // Deduplicate sources based on URI after the stream is complete
        const uniqueSources = Array.from(new Map(allSources.map(item => [item.web?.uri, item])).values());

        return { sources: uniqueSources };
    } catch (error) {
        console.error("Error in getGeminiResponseStream:", error);
        if (error instanceof Error) {
            // Re-throw the original error to be caught by the UI component
            throw error;
        }
        // Fallback for non-Error objects
        throw new Error("An unknown error occurred while fetching the response.");
    }
}