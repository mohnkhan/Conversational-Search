# Conversational Search

A powerful, feature-rich conversational search tool powered by the Google Gemini API. It leverages Google Search grounding for up-to-date, accurate information and integrates advanced generative AI capabilities for creating images and videos, providing a truly interactive and multi-modal experience.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Special Commands](#special-commands)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Prompt Engineering Tips](#prompt-engineering-tips)

## Key Features

-   **Grounded Conversational Search:** Get reliable answers with sources cited directly from Google Search.
-   **Dual-Model Support:**
    -   **Model Selection:** Manually switch between Gemini 2.5 Flash (for speed) and Gemini 2.5 Pro (for complex tasks).
    -   **Deep Research Mode:** Instantly toggle to use the more powerful Gemini 2.5 Pro model for in-depth, comprehensive answers to complex questions.
-   **Real-time Streaming:** Responses are streamed in real-time for a fluid, conversational feel.
-   **Full Markdown Support:**
    -   **Input Toolbar:** Easily format your messages with buttons for **bold**, *italic*, and `code blocks`.
    -   **Rendered Output:** Both user messages and model responses are beautifully rendered with support for lists, tables, code blocks, and more.
-   **Multi-modal Generation:**
    -   **Image Generation:** Create stunning, high-quality images using the `/imagine` command.
    -   **Video Generation:** Generate short, 720p videos from text prompts using the `/create-video` command.
-   **Enhanced Media Experience:**
    -   **Image Lightbox:** Click any generated image to view it in a full-screen, high-resolution lightbox.
    -   **Robust Video Player:** Play generated videos directly in the chat, with error handling and a download fallback.
-   **Advanced Search Filtering:** Filter results by time, including presets (past day, week, etc.) and custom date ranges.
-   **Smart Suggestions:** AI-powered suggestions for follow-up questions and related topics to guide your exploration.
-   **Chat Utilities:**
    -   **Persistent Chat History:** Conversations are saved locally for continuity.
    -   **Conversation Summarization:** Get a quick summary of your chat with a single click.
    -   **Copy & Export:** Easily copy individual messages, code blocks, the entire chat transcript, or export the conversation as a JSON file.
    -   **Feedback Mechanism:** Rate model responses with thumbs-up/down.
-   **Customizable Themes:** Personalize your experience with multiple built-in themes (e.g., Abyss, Daylight, Twilight, Latte).
-   **Secure API Key Flow:** An integrated and secure process for users to select their own billed API key, required for video generation.
-   **Polished & Responsive UI:** A clean, modern interface that works seamlessly across all devices.

## Technology Stack

-   **Frontend:** [React](https://react.dev/) (with Hooks) & [TypeScript](https://www.typescriptlang.org/)
-   **AI:** [Google Gemini API](https://ai.google.dev/gemini-api) (`@google/genai`)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Markdown:** [React Markdown](https://github.com/remarkjs/react-markdown) with [Remark GFM](https://github.com/remarkjs/remark-gfm)
-   **Syntax Highlighting:** [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

## Getting Started

This project is a static web application and can be run in any environment that serves static files.

### Prerequisites

You will need a Google Gemini API Key from [Google AI Studio](https://ai.google.dev/).

### Setup

1.  **Deploy the Application:** Deploy the project files (HTML, TSX, etc.) to your preferred hosting service (e.g., Vercel, Netlify, or a simple web server).
2.  **Configure General API Key:** Set your Gemini API Key as an environment variable named `API_KEY` in your hosting environment. This key will be used for standard features like conversational search and image generation.
3.  **Access the App:** Open the deployed URL in your browser to start using the application.

### Enabling Video Generation

The `/create-video` feature uses the Veo model, which requires an API key associated with a billed Google Cloud project.
- When you first use this command, a secure pop-up from AI Studio will appear, prompting you to select an appropriate billed API key.
- This is a one-time setup step. The key is managed by the AI Studio environment and is not stored by this application.

## Usage

Simply type your question in the input box and press Enter. The assistant will provide a grounded answer. Use the toolbar or markdown syntax to format your message.

-   **Deep Research:** For more complex queries, click the **sparkles icon** ✨ in the input bar to activate Deep Research mode. This will use the more powerful Gemini 2.5 Pro model for your next message to provide a more comprehensive response.

### Special Commands

-   `/imagine <prompt>`: Creates an image based on the text prompt that follows.
    -   *Example:* `/imagine a majestic lion wearing a crown, cinematic lighting`
-   `/create-video <prompt>`: Creates a short video based on the text prompt. This requires selecting a billed API key.
    -   *Example:* `/create-video a hummingbird flying in slow motion`

### Keyboard Shortcuts

A list of keyboard shortcuts for power users. *Use `Cmd` instead of `Ctrl` on macOS.*

| Shortcut          | Action                        |
| :---------------- | :---------------------------- |
| `Enter`           | Send message                  |
| `Shift` + `Enter` | Add a new line                |
| `Ctrl` + `K`      | Clear the entire chat         |
| `F`               | Toggle the search filter menu |
| `Ctrl` + `B`      | Apply **bold** formatting     |
| `Ctrl` + `I`      | Apply *italic* formatting     |
| `Ctrl` + `E`      | Apply `code block` formatting |
| `Esc`             | Close modals (Summary, Lightbox) |
| `?`               | Show keyboard shortcuts       |

## Prompt Engineering Tips

Crafting effective prompts is key to unlocking the full potential of the generative models.

-   **Be Specific and Detailed:** The more detail you provide, the better the model can understand your intent. (e.g., `Explain the concept of a black hole to a 12-year-old` vs. `Tell me about space`).
-   **Provide Context and Persona:** Tell the model who it should be. (e.g., `You are a marketing expert. Write an announcement for a new smartphone...`).
-   **Define the Output Format:** Explicitly ask for the format you want. (e.g., `List the pros and cons of coffee in a two-column markdown table`).
-   **For Images (`/imagine`):** Use descriptive adjectives, specify artistic styles (e.g., `cyberpunk`, `watercolor painting`), and set the scene (e.g., `dramatic cinematic lighting`, `macro shot`).
-   **For Videos (`/create-video`):** Focus on action and movement. Use camera work terms like "time-lapse," "slow motion," or "aerial shot."
