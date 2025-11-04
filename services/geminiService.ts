import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ChatMessage, Source, DateFilter, PredefinedDateFilter, CustomDateFilter, ModelId, ResearchScope, AttachedFile, BedrockCredentials, ToolCall } from '../types';

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
    type: 'api_key' | 'rate_limit' | 'safety' | 'billing' | 'permission' | 'argument' | 'server_error' | 'invalid_request' | 'unknown';
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
        const message = error.message.replace('[GoogleGenerativeAI Error]:', '').trim().toLowerCase();

        // API Key issues
        if (message.includes('api key not valid') || message.includes('api_key') || message.includes('requested entity was not found')) {
            return {
                type: 'api_key',
                message: "Your API key is invalid or not found. For standard models, ensure the `API_KEY` environment variable is set. For video generation, you may need to select a new key from a billed project.",
                retryable: false
            };
        }
        
        // Billing issues
        if (message.includes('billing') || message.includes('enable billing')) {
            return {
                type: 'billing',
                message: "A billing issue occurred. Please check that the Google Cloud project linked to your API key has billing enabled and the account is in good standing.",
                retryable: false
            };
        }

        // Permission issues (often for Veo)
        if (message.includes('permission denied')) {
            return {
                type: 'permission',
                message: "Permission denied. Your API key may lack permissions for this operation. For video generation, ensure the 'Vertex AI API' is enabled in your Google Cloud project.",
                retryable: false
            };
        }

        // Rate limiting
        if (message.includes('429') || message.includes('rate limit') || message.includes('resource has been exhausted')) {
            return {
                type: 'rate_limit',
                message: "You've exceeded the request limit for this model. Please wait a moment before trying again.",
                retryable: true
            };
        }
        
        // Safety settings
        if (message.includes('safety') || message.includes('blocked') || message.includes('finish reason: safety')) {
            return {
                type: 'safety',
                message: "The response was blocked by safety filters. This can be due to the prompt or the generated response. Please try rephrasing your request.",
                retryable: false
            };
        }

        // Invalid arguments
        if (message.includes('invalid argument')) {
             return {
                type: 'argument',
                message: "The request was invalid. This can happen if the prompt is empty, formatted incorrectly, or contains unsupported content. Please adjust your request and try again.",
                retryable: false
             };
        }
        
        // Server errors
        if (message.includes('500') || message.includes('internal error') || message.includes('server error')) {
            return {
                type: 'server_error',
                message: "The server encountered a temporary error. This is likely an issue on Google's side. Please try again in a few moments.",
                retryable: true
            };
        }

        // Generic but slightly more helpful
        return { 
            type: 'unknown',
            message: "An unexpected error occurred with the Gemini API. Please try again in a moment. If the problem persists, check the developer console for more details.",
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
    file?: { base64: string; mimeType: string },
    systemInstruction?: string,
// FIX: Added 'toolSchemas' parameter to fix argument count error in App.tsx.
    toolSchemas?: FunctionDeclaration[]
// FIX: Updated return type to be consistent with other streaming functions and provide necessary data to App.tsx.
): Promise<{ text: string, sources: Source[], toolCalls?: ToolCall[] }> {
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
                return (msg.role === 'user' || msg.role === 'model' || msg.role === 'tool') && !msg.isError && !msg.isThinking;
            }
        );

        const contents: any[] = processedHistory.map(msg => {
            if (msg.role === 'tool') {
                return {
                    role: msg.role,
                    parts: msg.toolResults!.map(tr => ({
                         toolResponse: {
                            id: tr.toolCallId,
                            response: { result: tr.result },
                         }
                    }))
                };
            }
            const parts: any[] = [];
            if(msg.text) { parts.push({ text: msg.text }); }
            if(msg.attachment) { parts.push({ inlineData: { mimeType: msg.attachment.type, data: msg.attachment.base64 }}) }
            return {
                role: msg.role,
                parts,
            };
        });

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
                const textPart = lastContent.parts.find((p: any) => p.text);
                if (textPart) {
                    textPart.text = prefix + textPart.text;
                } else {
                    lastContent.parts.unshift({ text: prefix });
                }
            }
        }

        const config: any = {};
        if (toolSchemas && toolSchemas.length > 0) {
            config.tools = [{ functionDeclarations: toolSchemas }];
        } else {
            config.tools = [{ googleSearch: {} }];
        }

        const finalSystemInstruction = [
            systemInstruction || '',
            prioritizeAuthoritative ? "You are a research assistant. When sourcing information from the web, you must prioritize authoritative, academic, and official sources. These include government websites (.gov), educational institutions (.edu), established news organizations, and peer-reviewed scientific journals. Synthesize information from these high-quality sources in your response. Avoid citing blogs, forums, or social media unless specifically asked." : ''
        ].filter(Boolean).join('\n\n');

        if (finalSystemInstruction) {
            config.systemInstruction = finalSystemInstruction;
        }

        const responseStream = await ai.models.generateContentStream({
            model: modelToUse,
            contents: contents,
            config: config,
        });
        
        let fullText = '';
        const allSources: Source[] = [];
        let allFunctionCalls: ToolCall[] = [];

        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
                onStreamUpdate(text);
                fullText += text;
            }
            
            if (chunk.functionCalls) {
                allFunctionCalls.push(...chunk.functionCalls.map((fc: any) => ({ id: fc.id, name: fc.name, args: fc.args })));
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

        return { text: fullText, sources: finalSources, toolCalls: allFunctionCalls.length > 0 ? allFunctionCalls : undefined };
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
        const code = errObj.code || null;

        if (code === 'invalid_api_key' || (type === 'invalid_request_error' && message.includes('API key'))) {
            return { type: 'api_key', message: `Invalid OpenAI API Key. Please check your key in Settings > API Key Manager.`, retryable: false };
        }
        if (type === 'insufficient_quota') {
            return { type: 'billing', message: 'You have exceeded your OpenAI quota or your trial has expired. Please check your billing details on the OpenAI platform.', retryable: false };
        }
        if (code === 'context_length_exceeded') {
             return { type: 'invalid_request', message: 'The conversation history is too long for this model. Please clear the chat to start a new conversation.', retryable: false };
        }
        if (type === 'server_error') {
            return { type: 'server_error', message: "An internal error occurred on OpenAI's servers. Please try again in a few moments.", retryable: true };
        }
        if (type === 'rate_limit_error') {
            return { type: 'rate_limit', message: "You've hit the rate limit for your OpenAI account. Please wait before sending another request.", retryable: true };
        }
        return { type: 'invalid_request', message, retryable: false };
    }

    if (error instanceof Error) {
        if (error.message.includes('key')) {
             return { type: 'api_key', message: 'Missing OpenAI API Key. Please add your key in Settings > API Key Manager.', retryable: false };
        }
    }

    return {
        type: 'unknown',
        message: 'An unknown error occurred while communicating with OpenAI. Check the developer console for details.',
        retryable: true
    };
}


const prepareOpenAIHistory = (history: ChatMessage[], systemInstruction?: string, file?: AttachedFile) => {
    const messages: any[] = [];

    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }

    history
        .filter(msg => !msg.isThinking && !msg.isError && (msg.text || msg.attachment || msg.toolCalls || msg.toolResults))
        .forEach(msg => {
            if (msg.role === 'tool') {
                messages.push({
                    role: 'tool',
                    tool_call_id: msg.toolResults![0].toolCallId,
                    content: msg.toolResults![0].result,
                });
                return;
            }

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
            messages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: content.length === 1 && content[0].type === 'text' ? content[0].text : content,
                tool_calls: msg.toolCalls ? msg.toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.args) } })) : undefined,
            });
    });

    if (file) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            const content = Array.isArray(lastMessage.content) ? lastMessage.content : [{ type: 'text', text: lastMessage.content }];
            content.push({
                type: 'image_url',
                image_url: {
                    url: `data:${file.type};base64,${file.base64}`
                }
            });
            lastMessage.content = content;
        }
    }
    
    return messages;
};

export async function getOpenAIResponseStream(
    history: ChatMessage[],
    model: string,
    onStreamUpdate: (text: string) => void,
    file?: { base64: string; mimeType: string; },
    systemInstruction?: string,
// FIX: Added 'toolSchemas' parameter to fix argument count error in App.tsx.
    toolSchemas?: FunctionDeclaration[]
// FIX: Updated return type to be consistent with other streaming functions and provide necessary data to App.tsx.
): Promise<{ text: string, toolCalls?: ToolCall[] }> {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
        throw new Error("OpenAI API key not found. Please set it in the API Key Manager.");
    }
    
    const attachedFileForHistory = file ? { name: '', size: 0, dataUrl: `data:${file.mimeType};base64,${file.base64}`, base64: file.base64, type: file.mimeType } : undefined;
    const messages = prepareOpenAIHistory(history, systemInstruction, attachedFileForHistory);

    const body: any = {
        model: model,
        messages: messages,
        stream: true,
    };
    
    if (toolSchemas && toolSchemas.length > 0) {
        body.tools = toolSchemas.map(s => ({ type: 'function', function: s }));
        body.tool_choice = "auto";
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
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
    let fullText = '';
    const toolCallChunks: { [index: number]: any } = {};

    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line === 'data: [DONE]') {
                const finalToolCalls = Object.values(toolCallChunks)
                    .map(tc => ({ id: tc.id, name: tc.function.name, args: JSON.parse(tc.function.arguments) }))
                    .filter(tc => tc.name && tc.id);
                return { text: fullText, toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined };
            }
            if (line.startsWith('data: ')) {
                try {
                    const json = JSON.parse(line.substring(6));
                    const delta = json.choices[0]?.delta;
                    if (delta?.content) {
                        onStreamUpdate(delta.content);
                        fullText += delta.content;
                    }
                     if (delta?.tool_calls) {
                        for (const tool_call_chunk of delta.tool_calls) {
                            const index = tool_call_chunk.index;
                            if (!toolCallChunks[index]) {
                                toolCallChunks[index] = { function: { arguments: '' } };
                            }
                            const tc = toolCallChunks[index];
                            if (tool_call_chunk.id) tc.id = tool_call_chunk.id;
                            if (tool_call_chunk.function?.name) tc.function.name = tool_call_chunk.function.name;
                            if (tool_call_chunk.function?.arguments) tc.function.arguments += tool_call_chunk.function.arguments;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing stream chunk:", e);
                }
            }
        }
    }
    const finalToolCalls = Object.values(toolCallChunks)
        .map(tc => ({ id: tc.id, name: tc.function.name, args: JSON.parse(tc.function.arguments) }))
        .filter(tc => tc.name && tc.id);
    return { text: fullText, toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined };
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

// ==================================================================
// --- ANTHROPIC SERVICE FUNCTIONS ---
// ==================================================================

const ANTHROPIC_API_KEY_STORAGE_KEY = 'anthropic-api-key';

export const getAnthropicKey = (): string | null => {
    try {
        return localStorage.getItem(ANTHROPIC_API_KEY_STORAGE_KEY);
    } catch {
        return null;
    }
};

export function parseClaudeError(error: unknown): ParsedError {
    console.error("Anthropic API Error:", error);

    if (error && typeof error === 'object' && 'error' in error) {
        const errObj = (error as any).error;
        const message = errObj.message || 'An unknown error occurred.';
        const type = errObj.type || 'unknown_error';

        switch (type) {
            case 'authentication_error':
                return { type: 'api_key', message: 'Invalid Anthropic API Key provided. Please check your key in Settings > API Key Manager.', retryable: false };
            case 'permission_error':
                 return { type: 'permission', message: 'Your Anthropic API key does not have permission for this action. Please check your Anthropic account settings.', retryable: false };
            case 'invalid_request_error':
                if (message.includes('input_image')) {
                    return { type: 'invalid_request', message: `There was an issue processing the attached image. Please try a different image. Details: ${message}`, retryable: false };
                }
                return { type: 'invalid_request', message: `The request was invalid. Details: ${message}`, retryable: false };
            case 'rate_limit_error':
                return { type: 'rate_limit', message: 'You have exceeded your Anthropic API rate limit. Please wait and try again.', retryable: true };
            case 'api_error':
                return { type: 'server_error', message: "An internal error occurred on Anthropic's side. Please try again later.", retryable: true };
            case 'overloaded_error':
                return { type: 'server_error', message: "Anthropic's servers are experiencing high traffic. Please wait a moment and try your request again.", retryable: true };
        }
    }

    if (error instanceof Error && error.message.includes('key')) {
        return { type: 'api_key', message: 'Missing Anthropic API Key. Please set it in Settings > API Key Manager.', retryable: false };
    }

    return { type: 'unknown', message: 'An unknown error occurred while communicating with Anthropic. Check the console for details.', retryable: true };
}

const prepareClaudeHistory = (history: ChatMessage[], file?: AttachedFile) => {
    const messages: any[] = [];
    
    history
        .filter(msg => !msg.isThinking && !msg.isError && (msg.text || msg.attachment || msg.toolCalls || msg.toolResults))
        .forEach(msg => {
            if(msg.role === 'model' && msg.toolCalls) {
                const content: any[] = msg.text ? [{ type: 'text', text: msg.text }] : [];
                content.push(...msg.toolCalls.map(tc => ({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args })));
                messages.push({ role: 'assistant', content });
                return;
            }

            if(msg.role === 'tool') {
                messages.push({
                    role: 'user',
                    content: msg.toolResults!.map(tr => ({
                        type: 'tool_result',
                        tool_use_id: tr.toolCallId,
                        content: tr.result,
                    }))
                });
                return;
            }

            const content: any[] = [];
            
            if (msg.role === 'user' && msg.attachment) {
                content.push({
                    type: 'image',
                    source: { type: 'base64', media_type: msg.attachment.type, data: msg.attachment.base64 }
                });
            }
            if (msg.text) {
                content.push({ type: 'text', text: msg.text });
            }
            
            messages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: content
            });
        });

    if (file) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            (lastMessage.content as any[]).unshift({
                type: 'image',
                source: { type: 'base64', media_type: file.type, data: file.base64 }
            });
        }
    }
    
    return messages;
};

export async function getClaudeResponseStream(
    history: ChatMessage[],
    model: string,
    onStreamUpdate: (text: string) => void,
    file?: { base64: string; mimeType: string; },
    systemInstruction?: string,
// FIX: Added 'toolSchemas' parameter to fix argument count error in App.tsx.
    toolSchemas?: FunctionDeclaration[]
// FIX: Updated return type to be consistent with other streaming functions and provide necessary data to App.tsx.
): Promise<{ text: string, toolCalls?: ToolCall[] }> {
    const apiKey = getAnthropicKey();
    if (!apiKey) {
        throw new Error("Anthropic API key not found. Please set it in the API Key Manager.");
    }
    
    const messages = prepareClaudeHistory(history, file ? { name: '', size: 0, dataUrl: `data:${file.mimeType};base64,${file.base64}`, base64: file.base64, type: file.mimeType } : undefined);

    const body: any = {
        model: model,
        messages: messages,
        stream: true,
        max_tokens: 4096,
    };

    if (systemInstruction) {
        body.system = systemInstruction;
    }

    if (toolSchemas && toolSchemas.length > 0) {
        body.tools = toolSchemas.map(s => ({
            name: s.name,
            description: s.description,
            input_schema: s.parameters,
        }));
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get stream reader.");

    const decoder = new TextDecoder();
    let fullText = '';
    const toolUseBlocks: { [index: number]: any } = {};
    let buffer = '';
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the last, potentially incomplete, line

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const json = JSON.parse(line.substring(6));
                    if (json.type === 'content_block_start' && json.content_block.type === 'tool_use') {
                        toolUseBlocks[json.index] = { id: json.content_block.id, name: json.content_block.name, input: '' };
                    }
                    if (json.type === 'content_block_delta' && json.delta.type === 'text_delta') {
                        onStreamUpdate(json.delta.text);
                        fullText += json.delta.text;
                    }
                     if (json.type === 'content_block_delta' && json.delta.type === 'input_json_delta') {
                        if (toolUseBlocks[json.index]) {
                            toolUseBlocks[json.index].input += json.delta.partial_json;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing Anthropic stream chunk:", e, "Line:", line);
                }
            }
        }
    }
    const finalToolCalls = Object.values(toolUseBlocks)
        .map(tc => ({ id: tc.id, name: tc.name, args: JSON.parse(tc.input) }))
        .filter(tc => tc.id && tc.name);
    return { text: fullText, toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined };
}

async function getClaudeChatCompletion(
    prompt: string,
    model: string,
    isJson: boolean = false // Claude doesn't have a JSON mode like OpenAI, but we can instruct it.
): Promise<string> {
    const apiKey = getAnthropicKey();
    if (!apiKey) throw new Error("Anthropic API key not set.");

    const fullPrompt = isJson 
        ? `${prompt}\n\nPlease format your response as a single JSON object, and nothing else.`
        : prompt;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }
    const data = await response.json();
    let textContent = data.content[0]?.text || '';

    // If JSON was requested, try to extract it
    if (isJson) {
        textContent = extractJson(textContent);
    }

    return textContent;
}


export async function getClaudeSuggestedPrompts(prompt: string, response: string, model: string): Promise<string[]> {
    const fullPrompt = `Based on this user query and model response, generate 3 concise and relevant follow-up questions a user might ask.

User Query: "${prompt}"

Model Response: "${response}"

Return a JSON object with a single key "questions" which is an array of 3 strings.`;
    try {
        const result = await getClaudeChatCompletion(fullPrompt, model, true);
        const parsed = JSON.parse(result);
        return Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];
    } catch (e) {
        console.error("Error getting Claude suggested prompts", e);
        return [];
    }
}

export async function getClaudeRelatedTopics(prompt: string, response: string, model: string): Promise<string[]> {
    const fullPrompt = `Based on the following user query and model response, generate 3-4 broader, related topics for exploration. These should be distinct from simple follow-up questions.

User Query: "${prompt}"

Model Response: "${response}"

Return a JSON object with a single key "topics" which is an array of 3-4 strings.`;
     try {
        const result = await getClaudeChatCompletion(fullPrompt, model, true);
        const parsed = JSON.parse(result);
        return Array.isArray(parsed.topics) ? parsed.topics.slice(0, 4) : [];
    } catch (e) {
        console.error("Error getting Claude related topics", e);
        return [];
    }
}

export async function getClaudeConversationSummary(messages: ChatMessage[], model: string): Promise<string> {
    const conversationHistory = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n\n');
    const fullPrompt = `Please provide a concise summary of the following conversation. Capture the main topics and key takeaways.

--- CONVERSATION START ---
${conversationHistory}
--- CONVERSATION END ---

Summary:`;
    return getClaudeChatCompletion(fullPrompt, model);
}

// ==================================================================
// --- AWS BEDROCK SERVICE FUNCTIONS ---
// ==================================================================

const BEDROCK_CREDENTIALS_KEY = 'bedrock-aws-credentials';

export const getBedrockCredentials = (): BedrockCredentials | null => {
    try {
        const saved = localStorage.getItem(BEDROCK_CREDENTIALS_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

export function parseBedrockError(error: unknown): ParsedError {
    console.error("AWS Bedrock API Error:", error);

    if (error && typeof error === 'object') {
        const err = error as any;
        const message = err.message || err.Message || 'An unknown error occurred.';
        
        if (message.includes('AccessDeniedException')) {
            return { type: 'permission', message: `AWS permission denied. Check your IAM user/role policies for 'bedrock:InvokeModel'. Details: ${message}`, retryable: false };
        }
        if (message.includes('ValidationException')) {
            return { type: 'invalid_request', message: `The request was invalid. Details: ${message}`, retryable: false };
        }
        if (message.includes('ThrottlingException')) {
             return { type: 'rate_limit', message: 'You have exceeded the request rate for your AWS account. Please wait and try again.', retryable: true };
        }
        if (message.includes('ServiceUnavailableException') || message.includes('InternalServerException')) {
            return { type: 'server_error', message: `The AWS Bedrock service is temporarily unavailable. Please try again later. Details: ${message}`, retryable: true };
        }
        if (message.includes('credentials')) {
            return { type: 'api_key', message: `Invalid AWS credentials. Please check your credentials in Settings > API Key Manager. Details: ${message}`, retryable: false };
        }
    }

    if (error instanceof Error && error.message.includes('Failed to fetch')) {
        return { type: 'unknown', message: 'Failed to connect to the bedrock proxy. Ensure it is running and accessible.', retryable: true };
    }

    return { type: 'unknown', message: 'An unknown error occurred while communicating with AWS Bedrock. Check the console for details.', retryable: true };
}


const prepareBedrockHistory = (modelId: string, history: ChatMessage[], systemInstruction?: string, file?: AttachedFile) => {
    if (modelId.startsWith('anthropic.')) {
        // Use the same format as direct Claude API
        return prepareClaudeHistory(history, file);
    }

    if (modelId.startsWith('meta.')) { // Llama 3
        const messages = history
            .filter(msg => !msg.isThinking && !msg.isError && msg.text)
            .map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            }));
        // Llama 3 on Bedrock uses a single string prompt. We must format it.
        let formattedPrompt = "";
        if (systemInstruction) {
            formattedPrompt += `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemInstruction}<|eot_id|>`;
        }
        messages.forEach(msg => {
            formattedPrompt += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
        });
        formattedPrompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`;

        return formattedPrompt;
    }
    
    // Default/Titan
    const messages = history
        .filter(msg => !msg.isThinking && !msg.isError && msg.text)
        .map(msg => `${msg.role === 'model' ? 'Bot' : 'User'}: ${msg.text}`)
        .join('\n');
    return systemInstruction ? `${systemInstruction}\n\n${messages}` : messages;
};

export async function getBedrockResponseStream(
    history: ChatMessage[],
    modelId: string,
    onStreamUpdate: (text: string) => void,
    file?: { base64: string; mimeType: string; },
    systemInstruction?: string,
// FIX: Added 'toolSchemas' parameter to fix argument count error in App.tsx.
    toolSchemas?: FunctionDeclaration[]
// FIX: Updated return type to be consistent with other streaming functions and provide necessary data to App.tsx.
): Promise<{ text: string, toolCalls?: ToolCall[] }> {
    const credentials = getBedrockCredentials();
    if (!credentials) throw new Error("AWS Bedrock credentials not found.");

    const attachedFileForHistory = file ? { name: '', size: 0, dataUrl: '', base64: file.base64, type: file.mimeType } : undefined;
    const messages = prepareBedrockHistory(modelId, history, systemInstruction, attachedFileForHistory);

    let body: any;
    if (modelId.startsWith('anthropic.')) {
        body = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 4096,
            system: systemInstruction,
            messages: messages,
        };
         if (toolSchemas && toolSchemas.length > 0) {
            body.tools = toolSchemas.map(s => ({
                toolSpec: {
                    name: s.name,
                    description: s.description,
                    inputSchema: { json: s.parameters }
                }
            }));
        }
    } else if (modelId.startsWith('meta.')) {
        body = {
            prompt: messages,
            max_gen_len: 2048,
            temperature: 0.5,
        };
    } else if (modelId.startsWith('amazon.')) {
         body = {
            inputText: messages,
            textGenerationConfig: {
                maxTokenCount: 4096,
                temperature: 0.7,
            }
        };
    } else {
        throw new Error(`Unsupported Bedrock model for streaming: ${modelId}`);
    }

    // IMPORTANT: For security, never send AWS credentials from the client directly to AWS.
    // This fetch call assumes a secure backend proxy is running at `/api/bedrock-proxy/invoke-stream`
    // which takes the credentials and request body, signs the request, and forwards it to AWS.
    const response = await fetch('/api/bedrock-proxy/invoke-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            credentials,
            modelId,
            body,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get stream reader.");
    
    const decoder = new TextDecoder();
    let fullText = '';
    const toolUseBlocks: { [id: string]: any } = {};

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
            const data = JSON.parse(chunk);
            if (data.chunk?.bytes) {
                const chunkPayload = JSON.parse(atob(data.chunk.bytes));
                if (modelId.startsWith('anthropic.')) {
                    if (chunkPayload.type === 'content_block_start' && chunkPayload.content_block.type === 'tool_use') {
                        const { toolUseId, name } = chunkPayload.content_block;
                        toolUseBlocks[toolUseId] = { id: toolUseId, name, input: '' };
                    }
                    if (chunkPayload.type === 'content_block_delta') {
                        if(chunkPayload.delta.type === 'text_delta') {
                            onStreamUpdate(chunkPayload.delta.text);
                            fullText += chunkPayload.delta.text;
                        } else if (chunkPayload.delta.type === 'input_json_delta') {
                             if (toolUseBlocks[chunkPayload.toolUseId]) {
                                toolUseBlocks[chunkPayload.toolUseId].input += chunkPayload.delta.partial_json;
                            }
                        }
                    }
                } else if (modelId.startsWith('meta.')) {
                    if (chunkPayload.generation) {
                        onStreamUpdate(chunkPayload.generation);
                        fullText += chunkPayload.generation;
                    }
                } else if (modelId.startsWith('amazon.')) {
                    if (chunkPayload.outputText) {
                        onStreamUpdate(chunkPayload.outputText);
                        fullText += chunkPayload.outputText;
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing Bedrock stream chunk", e, "Chunk:", chunk);
        }
    }

    if (modelId.startsWith('anthropic.')) {
        const finalToolCalls = Object.values(toolUseBlocks)
            .map(tc => ({ id: tc.id, name: tc.name, args: JSON.parse(tc.input) }))
            .filter(tc => tc.id && tc.name);
        return { text: fullText, toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined };
    }
    
    return { text: fullText };
}

async function getBedrockChatCompletion(prompt: string, modelId: string): Promise<string> {
    const credentials = getBedrockCredentials();
    if (!credentials) throw new Error("AWS Bedrock credentials not found.");

    let body: any;
    if (modelId.startsWith('anthropic.')) {
         body = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        };
    } else if (modelId.startsWith('meta.')) {
        body = {
            prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
            max_gen_len: 2048
        };
    } else { // Titan
        body = { inputText: prompt, textGenerationConfig: { maxTokenCount: 2048 } };
    }

    const response = await fetch('/api/bedrock-proxy/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, modelId, body }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }

    const responseBody = await response.json();
    let textContent = '';
    
    if (modelId.startsWith('anthropic.')) {
        textContent = responseBody.content[0]?.text || '';
    } else if (modelId.startsWith('meta.')) {
        textContent = responseBody.generation || '';
    } else { // Titan
        textContent = responseBody.results[0]?.outputText || '';
    }

    return textContent;
}

export async function getBedrockConversationSummary(messages: ChatMessage[], model: ModelId): Promise<string> {
    const conversationHistory = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n\n');
    const fullPrompt = `Please provide a concise summary of the following conversation. Capture the main topics and key takeaways.\n\n--- CONVERSATION START ---\n${conversationHistory}\n--- CONVERSATION END ---\n\nSummary:`;
    return getBedrockChatCompletion(fullPrompt, model);
}

export async function getBedrockSuggestedPrompts(prompt: string, response: string, model: string): Promise<string[]> {
    const fullPrompt = `Based on this user query and model response, generate 3 concise and relevant follow-up questions a user might ask.

User Query: "${prompt}"

Model Response: "${response}"

Return ONLY a JSON object with a single key "questions" which is an array of 3 strings.`;
    try {
        const result = await getBedrockChatCompletion(fullPrompt, model);
        const jsonResult = extractJson(result);
        const parsed = JSON.parse(jsonResult);
        return Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];
    } catch (e) {
        console.error("Error getting Bedrock suggested prompts", e);
        return [];
    }
}

export async function getBedrockRelatedTopics(prompt: string, response: string, model: string): Promise<string[]> {
    const fullPrompt = `Based on the following user query and model response, generate 3-4 broader, related topics for exploration. These should be distinct from simple follow-up questions.

User Query: "${prompt}"

Model Response: "${response}"

Return ONLY a JSON object with a single key "topics" which is an array of 3-4 strings.`;
     try {
        const result = await getBedrockChatCompletion(fullPrompt, model);
        const jsonResult = extractJson(result);
        const parsed = JSON.parse(jsonResult);
        return Array.isArray(parsed.topics) ? parsed.topics.slice(0, 4) : [];
    } catch (e) {
        console.error("Error getting Bedrock related topics", e);
        return [];
    }
}
