import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Source, DateFilter, PredefinedDateFilter, CustomDateFilter } from '../types';

// A module-level instance for non-Veo calls
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not set for standard models.");
}

/**
 * A structured error object for better handling in the UI.
 */
export interface ParsedError {
    type: 'api_key' | 'rate_limit' | 'safety' | 'billing' | 'generic' | 'unknown';
    message: string;
}

/**
 * Translates a raw API error into a structured, user-friendly object.
 * @param error The unknown error object caught from an API call.
 * @returns A ParsedError object containing an error type and a user-friendly message.
 */
export function parseGeminiError(error: unknown): ParsedError {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // API Key issues
        if (message.includes('api key not valid') || message.includes('api_key') || message.includes('requested entity was not found')) {
            return {
                type: 'api_key',
                message: "There's an issue with your API key. Please ensure it is valid and has billing enabled for features like video generation. You may need to select a new key."
            };
        }

        // Rate limiting
        if (message.includes('429') || message.includes('rate limit')) {
            return {
                type: 'rate_limit',
                message: "The service is currently experiencing high traffic. Please wait a moment and try your request again."
            };
        }
        
        // Safety settings
        if (message.includes('safety') || message.includes('blocked')) {
            return {
                type: 'safety',
                message: "Your prompt or the model's response was blocked due to safety filters. Please try rephrasing your request."
            };
        }

        // Billing issues
        if (message.includes('billing')) {
            return {
                type: 'billing',
                message: "There seems to be a billing issue with the project. Please check the associated billing account to ensure it's active."
            };
        }

        // Generic but slightly more helpful
        return { 
            type: 'generic',
            message: `An unexpected error occurred: ${error.message}. Please try again.`
        };
    }

    // Fallback for non-Error objects
    return {
        type: 'unknown',
        message: 'An unknown error occurred. Please check your connection and try again.'
    };
}

const getDateFilterPrefix = (filter: DateFilter): string => {
    if (typeof filter === 'string') {
        const predefinedFilter = filter as PredefinedDateFilter;
        switch (predefinedFilter) {
            case 'day': return 'Search for information from the past 24 hours. ';
            case 'week': return 'Search for information from the past week. ';
            case 'month': return 'Search for information from the past month. ';
            case 'year': return 'Search for information from the past year. ';
            case 'any':
            default:
                return '';
        }
    } else {
        const customFilter = filter as CustomDateFilter;
        const { startDate, endDate } = customFilter;
        if (startDate && endDate) {
            return `Search for information between ${startDate} and ${endDate}. `;
        }
        if (startDate) {
            return `Search for information after ${startDate}. `;
        }
        if (endDate) {
            return `Search for information before ${endDate}. `;
        }
        return '';
    }
}

export async function getGeminiResponseStream(
    history: ChatMessage[],
    filter: DateFilter,
    onStreamUpdate: (text: string) => void
): Promise<{ sources: Source[] }> {
    if (!ai) throw new Error("Gemini AI client not initialized.");
    try {
        const processedHistory = history.filter(
            (msg, index) => {
                // Ignore the very first message if it's the initial model greeting to ensure conversation starts with a user prompt
                if (index === 0 && msg.role === 'model') {
                    return false;
                }
                // Include only valid, text-based user and model messages
                return (msg.role === 'user' || msg.role === 'model') && msg.text && !msg.isError && !msg.imageUrl && !msg.videoUrl;
            }
        );

        const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = processedHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        }));

        // Apply date filter prefix ONLY to the last user message
        if (contents.length > 0) {
            const lastContent = contents[contents.length - 1];
            if (lastContent.role === 'user') {
                const prefix = getDateFilterPrefix(filter);
                lastContent.parts[0].text = prefix + lastContent.parts[0].text;
            }
        }

        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: contents,
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


export async function generateImage(prompt: string): Promise<string> {
    if (!ai) throw new Error("Gemini AI client not initialized.");
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
            },
        });
      
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;

    } catch (error) {
        console.error("Error in generateImage:", error);
        throw error;
    }
}

export async function generateVideo(prompt: string): Promise<string> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set for video generation.");
    }
    // Create a new instance for every Veo call to ensure the latest key is used
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        let operation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            operation = await videoAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }

        // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch(error) {
        console.error("Error in generateVideo:", error);
        throw error;
    }
}


export async function getSuggestedPrompts(
    prompt: string,
    response: string
): Promise<string[]> {
    if (!ai) return [];
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
    if (!ai) return [];
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
    if (!ai) throw new Error("Gemini AI client not initialized.");
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