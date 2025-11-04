import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Source, DateFilter, PredefinedDateFilter, CustomDateFilter, ModelId, ResearchScope, AttachedFile } from '../types';

// A module-level instance for non-Veo calls
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not set for standard models.");
}

/**
 * Extracts a JSON string from text that might be wrapped in markdown code fences
 * or have conversational prefixes/suffixes.
 * @param text The raw string from the model.
 * @returns The extracted JSON string, or an empty string if no valid JSON is found.
 */
function extractJson(text: string): string {
    // Attempt to find JSON within markdown code blocks
    const markdownMatch = text.match(/```(json)?\s*([\s\S]+?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        return markdownMatch[2].trim();
    }

    // Fallback for cases where the model doesn't use markdown.
    // It finds the first '{' or '[' and the last '}' or ']'.
    const firstBracket = text.indexOf('{');
    const firstSquare = text.indexOf('[');
    
    let startIndex = -1;
    if (firstBracket === -1) {
        startIndex = firstSquare;
    } else if (firstSquare === -1) {
        startIndex = firstBracket;
    } else {
        startIndex = Math.min(firstBracket, firstSquare);
    }

    if (startIndex === -1) {
        return ''; // No JSON object/array found
    }
    
    const lastBracket = text.lastIndexOf('}');
    const lastSquare = text.lastIndexOf(']');
    const endIndex = Math.max(lastBracket, lastSquare);

    if (endIndex > startIndex) {
        return text.substring(startIndex, endIndex + 1).trim();
    }

    return ''; // No valid JSON structure found
}

/**
 * A structured error object for better handling in the UI.
 */
export interface ParsedError {
    type: 'api_key' | 'rate_limit' | 'safety' | 'billing' | 'permission' | 'argument' | 'generic' | 'unknown' | 'server_error' | 'invalid_request';
    message: string;
    retryable: boolean;
}

/**
 * Translates a raw API error into a structured, user-friendly object.
 * @param error The unknown error object caught from an API call.
 * @returns A ParsedError object containing an error type and a user-friendly message.
 */
export function parseGeminiError(error: unknown): ParsedError {
    console.error("Gemini API Error:", error); // Log the raw error for debugging

    if (error instanceof Error) {
        // [GoogleGenerativeAI Error]: usually prefixes specific errors
        const message = error.message.replace('[GoogleGenerativeAI Error]:', '').trim().toLowerCase();

        // API Key issues
        if (message.includes('api key not valid') || message.includes('api_key') || message.includes('requested entity was not found')) {
            return {
                type: 'api_key',
                message: "Your API key is invalid or not found. Please ensure it's correct. For video generation, you may need to select a new key from a billed project.",
                retryable: false
            };
        }
        
        // Billing issues
        if (message.includes('billing') || message.includes('enable billing')) {
            return {
                type: 'billing',
                message: "A billing issue was encountered. Please check that the associated Google Cloud project has billing enabled and the account is in good standing.",
                retryable: false
            };
        }

        // Permission issues (often for Veo)
        if (message.includes('permission denied')) {
            return {
                type: 'permission',
                message: "Permission denied. Your API key may not have the necessary permissions for this operation (e.g., video generation). Ensure the 'Vertex AI API' is enabled in your project.",
                retryable: false
            };
        }

        // Rate limiting
        if (message.includes('429') || message.includes('rate limit') || message.includes('resource has been exhausted')) {
            return {
                type: 'rate_limit',
                message: "You've exceeded the request limit. Please wait a moment before trying again.",
                retryable: true
            };
        }
        
        // Safety settings
        if (message.includes('safety') || message.includes('blocked') || message.includes('finish reason: safety')) {
            return {
                type: 'safety',
                message: "The request was blocked due to safety filters. This could be due to the prompt or the model's potential response. Please try rephrasing.",
                retryable: false
            };
        }

        // Invalid arguments
        if (message.includes('invalid argument')) {
             return {
                type: 'argument',
                message: "The request was invalid, which can happen if the prompt is formatted incorrectly. Please try rephrasing.",
                retryable: false
             };
        }

        // Generic but slightly more helpful
        return { 
            type: 'generic',
            message: "An unexpected server error occurred. This might be a temporary issue. Please try again in a moment.",
            retryable: true
        };
    }

    // Fallback for non-Error objects
    return {
        type: 'unknown',
        message: 'An unknown error occurred. This might be a temporary issue. Please check the developer console for more details.',
        retryable: true
    };
}

const getInstructionalPrefix = (filter: DateFilter, scope: ResearchScope | null): string => {
    let prefix = '';

    if (scope) {
        switch (scope) {
            case 'comprehensive':
                prefix += 'Conduct a deep research analysis on the following topic, providing a comprehensive and detailed response with multiple perspectives if applicable. Topic: ';
                break;
            case 'pros-cons':
                prefix += 'You are an impartial analyst. For the following topic, create a detailed and balanced list of the primary pros and cons. Provide evidence or examples for each point where possible. Topic: ';
                break;
            case 'historical':
                prefix += 'Provide a detailed historical context and timeline for the following topic. Focus on its origins, evolution, and key milestones. Topic: ';
                break;
            case 'compare-contrast':
                prefix += 'Conduct a thorough compare and contrast analysis of the following topics. Structure your response to clearly highlight both similarities and differences in a structured format like a table if appropriate. Topics: ';
                break;
            case 'technical':
                 prefix += 'Provide a highly technical and specific deep-dive into the following topic. Use precise terminology, and include code examples, formulas, or technical specifications where relevant. Topic: ';
                 break;
        }
    }

    if (typeof filter === 'string') {
        const predefinedFilter = filter as PredefinedDateFilter;
        switch (predefinedFilter) {
            case 'day': prefix += 'Search for information from the past 24 hours. '; break;
            case 'week': prefix += 'Search for information from the past week. '; break;
            case 'month': prefix += 'Search for information from the past month. '; break;
            case 'year': prefix += 'Search for information from the past year. '; break;
        }
    } else {
        const customFilter = filter as CustomDateFilter;
        const { startDate, endDate } = customFilter;
        if (startDate && endDate) {
            prefix += `Search for information between ${startDate} and ${endDate}. `;
        } else if (startDate) {
            prefix += `Search for information after ${startDate}. `;
        } else if (endDate) {
            prefix += `Search for information before ${endDate}. `;
        }
    }
    return prefix;
};


export async function getGeminiResponseStream(
    history: ChatMessage[],
    filter: DateFilter,
    onStreamUpdate: (text: string) => void,
    model: ModelId,
    researchScope: ResearchScope | null = null,
    prioritizeAuthoritative: boolean = false,
    file?: { base64: string; mimeType: string }
): Promise<{ sources: Source[] }> {
    if (!ai) throw new Error("Gemini AI client not initialized.");

    const isDeepResearchActive = !!researchScope;
    const modelToUse = isDeepResearchActive ? 'gemini-2.5-pro' : model;
    
    try {
        const processedHistory = history.filter(
            (msg, index) => {
                // Ignore the very first message if it's the initial model greeting to ensure conversation starts with a user prompt
                if (index === 0 && msg.role === 'model') {
                    return false;
                }
                // Include only valid, non-generated user and model messages
                return (msg.role === 'user' || msg.role === 'model') && !msg.isError && !msg.imageUrl && !msg.videoUrl;
            }
        );

        const contents: any[] = processedHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        }));

        // If a file is attached, add it as a new part to the last user message.
        if (contents.length > 0 && file) {
            const lastContent = contents[contents.length - 1];
            if (lastContent.role === 'user') {
                lastContent.parts.push({
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.base64,
                    },
                });
            }
        }

        // Apply instructional prefixes to the text part of the last user message
        if (contents.length > 0) {
            const lastContent = contents[contents.length - 1];
            if (lastContent.role === 'user') {
                const prefix = getInstructionalPrefix(filter, researchScope);
                // Ensure the text part exists before prepending
                if(lastContent.parts[0].text) {
                    lastContent.parts[0].text = prefix + lastContent.parts[0].text;
                } else {
                    lastContent.parts[0].text = prefix;
                }
            }
        }

        const config: any = {
            tools: [{ googleSearch: {} }],
        };

        if (prioritizeAuthoritative) {
            config.systemInstruction = "You are a research assistant. When sourcing information from the web, you must prioritize authoritative, academic, and official sources. These include government websites (.gov), educational institutions (.edu), established news organizations, and peer-reviewed scientific journals. Synthesize information from these high-quality sources in your response. Avoid citing blogs, forums, or social media unless specifically asked.";
        }

        const responseStream = await ai.models.generateContentStream({
            model: modelToUse,
            contents: contents,
            config: config,
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

        let finalSources = uniqueSources;
        if (prioritizeAuthoritative) {
            const BLOCKED_DOMAINS = [
                'youtube.com',
                'facebook.com',
                'twitter.com',
                'instagram.com',
                'reddit.com',
                'quora.com',
                'pinterest.com',
                'tiktok.com',
                'blogspot.com',
                'wordpress.com',
                'medium.com',
                'forbes.com', // Often has contributor content of varying quality
                'businessinsider.com',
            ];
            
            finalSources = uniqueSources.filter(source => {
                if (!source.web?.uri) return false;
                try {
                    const domain = new URL(source.web.uri).hostname.replace(/^www\./, '');
                    return !BLOCKED_DOMAINS.some(blockedDomain => domain.includes(blockedDomain));
                } catch (e) {
                    console.warn(`Invalid source URL, filtering out: ${source.web.uri}`, e);
                    return false; // Invalid URL
                }
            });
        }

        return { sources: finalSources };
    } catch (error) {
        console.error("Error in getGeminiResponseStream:", error);
        // Re-throw the original error to be caught and parsed by the UI component
        throw error;
    }
}


export async function generateImageWithImagen(prompt: string): Promise<string> {
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


export async function getGeminiSuggestedPrompts(
    prompt: string,
    response: string,
    model: ModelId
): Promise<string[]> {
    if (!ai) return [];
    try {
        const fullPrompt = `Based on this user query and model response, generate 3 concise and relevant follow-up questions a user might ask.

User Query: "${prompt}"

Model Response: "${response}"

Return the questions as a JSON object with a single key "questions" which is an array of strings.`;

        const result = await ai.models.generateContent({
            model: model,
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
        const cleanedJson = extractJson(jsonString);
        if (!cleanedJson) {
            return [];
        }
        
        const parsed = JSON.parse(cleanedJson);

        if (parsed) {
            // Handle the expected format: { questions: ["...", "..."] }
            if (Array.isArray(parsed.questions)) {
                return parsed.questions.slice(0, 3).filter((q: unknown) => typeof q === 'string');
            }
            // Handle the fallback format where the model just returns the array: ["...", "..."]
            if (Array.isArray(parsed)) {
                return parsed.slice(0, 3).filter((q: unknown) => typeof q === 'string');
            }
        }

        return [];
    } catch (error) {
        console.error("Error generating suggested prompts:", error);
        // Fail silently and return an empty array
        return [];
    }
}

export async function getGeminiRelatedTopics(
    prompt: string,
    response: string,
    model: ModelId
): Promise<string[]> {
    if (!ai) return [];
    try {
        const fullPrompt = `Based on the following user query and model response, generate 3-4 broader, related topics for exploration. These should be distinct from simple follow-up questions.

User Query: "${prompt}"

Model Response: "${response}"

Return the topics as a JSON object with a single key "topics" which is an array of strings.`;

        const result = await ai.models.generateContent({
            model: model,
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
        const cleanedJson = extractJson(jsonString);
        if (!cleanedJson) {
            return [];
        }
        const parsed = JSON.parse(cleanedJson);

        if (parsed) {
            // Handle the expected format: { topics: ["...", "..."] }
            if (Array.isArray(parsed.topics)) {
                return parsed.topics.slice(0, 4).filter((t: unknown) => typeof t === 'string');
            }
             // Handle the fallback format where the model just returns the array: ["...", "..."]
            if (Array.isArray(parsed)) {
                return parsed.slice(0, 4).filter((t: unknown) => typeof t === 'string');
            }
        }

        return [];
    } catch (error) {
        console.error("Error generating related topics:", error);
        // Fail silently and return an empty array
        return [];
    }
}


export async function getGeminiConversationSummary(
    messages: ChatMessage[],
    model: ModelId
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
            model: model,
            contents: fullPrompt,
        });

        return result.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        // Re-throw the original error to be handled by the UI
        throw error;
    }
}


// ==================================================================
// --- OPENAI SERVICE FUNCTIONS ---
// ==================================================================

const OPENAI_API_KEY_STORAGE_KEY = 'openai-api-key';

export const getOpenAIKey = (): string | null => {
    try {
        return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
    } catch {
        return null;
    }
};

export function parseOpenAIError(error: unknown): ParsedError {
    console.error("OpenAI API Error:", error);

    if (error && typeof error === 'object' && 'error' in error) {
        const errObj = (error as any).error;
        const message = errObj.message || 'An unknown error occurred.';
        const type = errObj.type || 'unknown_error';

        if (type === 'invalid_request_error') {
            if (message.includes('API key')) {
                return { type: 'api_key', message: `Invalid OpenAI API Key provided. Please check your key in the API Key Manager.`, retryable: false };
            }
            return { type: 'invalid_request', message, retryable: false };
        }
        if (type === 'insufficient_quota') {
            return { type: 'rate_limit', message: 'You have exceeded your OpenAI quota. Please check your billing details on the OpenAI platform.', retryable: false };
        }
        if (type === 'server_error') {
            return { type: 'server_error', message: 'An internal error occurred on the OpenAI side. Please try again later.', retryable: true };
        }
    }

    if (error instanceof Error) {
        if (error.message.includes('key')) {
             return { type: 'api_key', message: 'Missing or invalid OpenAI API Key. Please set it in the API Key Manager.', retryable: false };
        }
    }

    return {
        type: 'unknown',
        message: 'An unknown error occurred while communicating with OpenAI. Check the console for details.',
        retryable: true
    };
}


const prepareOpenAIHistory = (history: ChatMessage[], file?: AttachedFile) => {
    const messages = history
        .filter(msg => !msg.isThinking && !msg.isError && (msg.text || msg.attachment))
        .map(msg => {
            const content: any[] = [];
            if (msg.text) {
                content.push({ type: 'text', text: msg.text });
            }
            if (msg.role === 'user' && msg.attachment) {
                 content.push({
                     type: 'image_url',
                     image_url: {
                         url: msg.attachment.dataUrl,
                     }
                 });
            }
            return {
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: content
            };
    });

    if (file) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            (lastMessage.content as any[]).push({
                type: 'image_url',
                image_url: {
                    url: `data:${file.type};base64,${file.base64}`
                }
            });
        }
    }
    
    return messages;
};

export async function getOpenAIResponseStream(
    history: ChatMessage[],
    model: string,
    onStreamUpdate: (text: string) => void,
    file?: { base64: string; mimeType: string; }
): Promise<void> {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
        throw new Error("OpenAI API key not found. Please set it in the API Key Manager.");
    }
    
    // FIX: The object passed to prepareOpenAIHistory must conform to the AttachedFile interface, which requires a 'type' property.
    const messages = prepareOpenAIHistory(history, file ? { name: '', size: 0, dataUrl: `data:${file.mimeType};base64,${file.base64}`, base64: file.base64, type: file.mimeType } : undefined);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Failed to get stream reader.");
    }

    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line === 'data: [DONE]') {
                return;
            }
            if (line.startsWith('data: ')) {
                try {
                    const json = JSON.parse(line.substring(6));
                    const textChunk = json.choices[0]?.delta?.content;
                    if (textChunk) {
                        onStreamUpdate(textChunk);
                    }
                } catch (e) {
                    console.error("Error parsing stream chunk:", e);
                }
            }
        }
    }
}

export async function generateImageWithDallE(prompt: string): Promise<string> {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
        throw new Error("OpenAI API key not found. Please set it in the API Key Manager.");
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }

    const data = await response.json();
    const b64_json = data.data[0].b64_json;
    return `data:image/png;base64,${b64_json}`;
}

async function getOpenAIChatCompletion(
    prompt: string,
    model: string,
    isJson: boolean = false
): Promise<string> {
    const apiKey = getOpenAIKey();
    if (!apiKey) throw new Error("OpenAI API key not set.");
    
    const body: any = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
    };

    if(isJson) {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`},
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

export async function getOpenAISuggestedPrompts(prompt: string, response: string, model: string): Promise<string[]> {
    const fullPrompt = `Based on this user query and model response, generate 3 concise and relevant follow-up questions a user might ask.

User Query: "${prompt}"

Model Response: "${response}"

Return a JSON object with a single key "questions" which is an array of 3 strings.`;
    try {
        const result = await getOpenAIChatCompletion(fullPrompt, model, true);
        const parsed = JSON.parse(result);
        return Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];
    } catch (e) {
        console.error("Error getting OpenAI suggested prompts", e);
        return [];
    }
}

export async function getOpenAIRelatedTopics(prompt: string, response: string, model: string): Promise<string[]> {
    const fullPrompt = `Based on the following user query and model response, generate 3-4 broader, related topics for exploration. These should be distinct from simple follow-up questions.

User Query: "${prompt}"

Model Response: "${response}"

Return a JSON object with a single key "topics" which is an array of 3-4 strings.`;
     try {
        const result = await getOpenAIChatCompletion(fullPrompt, model, true);
        const parsed = JSON.parse(result);
        return Array.isArray(parsed.topics) ? parsed.topics.slice(0, 4) : [];
    } catch (e) {
        console.error("Error getting OpenAI related topics", e);
        return [];
    }
}

export async function getOpenAIConversationSummary(messages: ChatMessage[], model: string): Promise<string> {
    const conversationHistory = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n\n');
    const fullPrompt = `Please provide a concise summary of the following conversation. Capture the main topics and key takeaways.

--- CONVERSATION START ---
${conversationHistory}
--- CONVERSATION END ---

Summary:`;
    return getOpenAIChatCompletion(fullPrompt, model);
}