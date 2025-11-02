import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Source, DateFilter } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Translates a raw API error into a user-friendly and actionable message.
 * @param error The unknown error object caught from an API call.
 * @returns A string containing a user-friendly error message.
 */
export function parseGeminiError(error: unknown): string {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // API Key issues
        if (message.includes('api key not valid') || message.includes('api_key')) {
            return "There's an issue with the API key configuration. Please ensure it's set up correctly. If the problem persists, contact support.";
        }

        // Rate limiting
        if (message.includes('429') || message.includes('rate limit')) {
            return "The service is currently experiencing high traffic. Please wait a moment and try your request again.";
        }
        
        // Safety settings
        if (message.includes('safety') || message.includes('blocked')) {
            return "Your prompt or the model's response was blocked due to safety filters. Please try rephrasing your request.";
        }

        // Billing issues
        if (message.includes('billing')) {
            return "There seems to be a billing issue with the project. Please check the associated billing account. If the problem persists, contact support.";
        }

        // Generic but slightly more helpful
        return `An unexpected error occurred: ${error.message}. Please try again.`;
    }

    // Fallback for non-Error objects
    return 'An unknown error occurred. Please check your connection and try again.';
}

const getDateFilterPrefix = (filter: DateFilter): string => {
    switch (filter) {
        case 'day': return 'Search for information from the past 24 hours. ';
        case 'week': return 'Search for information from the past week. ';
        case 'month': return 'Search for information from the past month. ';
        case 'year': return 'Search for information from the past year. ';
        case 'any':
        default:
            return '';
    }
}

export async function getGeminiResponseStream(
    prompt: string,
    filter: DateFilter,
    onStreamUpdate: (text: string) => void
): Promise<{ sources: Source[] }> {
    try {
        const prefix = getDateFilterPrefix(filter);
        const fullPrompt = prefix + prompt;

        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
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
        // Re-throw the original error to be caught and parsed by the UI component
        throw error;
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

export async function getRelatedTopics(
    prompt: string,
    response: string
): Promise<string[]> {
    try {
        const fullPrompt = `Based on the following user query and model response, generate 3-4 broader, related topics for exploration. These should be distinct from simple follow-up questions.

User Query: "${prompt}"

Model Response: "${response}"

Return the topics as a JSON object with a single key "topics" which is an array of strings.`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topics: {
                            type: Type.ARRAY,
                            description: 'A list of 3-4 broader, related topics for exploration.',
                            items: {
                                type: Type.STRING,
                            },
                        },
                    },
                    required: ['topics'],
                },
            },
        });

        const jsonString = result.text;
        const parsed = JSON.parse(jsonString);

        if (parsed && Array.isArray(parsed.topics)) {
            return parsed.topics.slice(0, 4); // Ensure max 4 topics
        }

        return [];
    } catch (error) {
        console.error("Error generating related topics:", error);
        // Fail silently and return an empty array
        return [];
    }
}


export async function getConversationSummary(
    messages: ChatMessage[]
): Promise<string> {
    try {
        const conversationHistory = messages.map(msg => {
            return `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`;
        }).join('\n\n');

        const fullPrompt = `Please provide a concise summary of the following conversation. Capture the main topics and key takeaways.

--- CONVERSATION START ---
${conversationHistory}
--- CONVERSATION END ---

Summary:`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return result.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        // Re-throw the original error to be handled by the UI
        throw error;
    }
}