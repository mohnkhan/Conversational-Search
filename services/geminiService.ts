import { GoogleGenAI, Type } from "@google/genai";
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


export async function getSuggestedPrompts(
    prompt: string,
    response: string
): Promise<string[]> {
    try {
        const fullPrompt = `Based on this user query and model response, generate 3 concise and relevant follow-up questions a user might ask.

User Query: "${prompt}"

Model Response: "${response}"

Return the questions as a JSON object with a single key "questions" which is an array of strings.`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            description: 'A list of 3 suggested follow-up questions.',
                            items: {
                                type: Type.STRING,
                            },
                        },
                    },
                    required: ['questions'],
                },
            },
        });

        const jsonString = result.text;
        const parsed = JSON.parse(jsonString);

        if (parsed && Array.isArray(parsed.questions)) {
            return parsed.questions.slice(0, 3); // Ensure max 3 questions
        }

        return [];
    } catch (error) {
        console.error("Error generating suggested prompts:", error);
        // Fail silently and return an empty array
        return [];
    }
}