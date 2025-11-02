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
-   **Multi-modal Generation:**
    -   **Image Generation:** Create stunning, high-quality images using the `/imagine` command.
    -   **Video Generation:** Generate short, 720p videos from text prompts using the `/create-video` command.
-   **Productivity Tools:**
    -   **Integrated To-Do List:** Manage tasks that arise during your conversation directly within a dedicated modal. Your tasks are saved locally.
    -   **Recent Search History:** Automatically saves your last 5 queries, allowing you to quickly revisit or re-run past searches from the start screen.
    -   **Custom CSS Editor:** Inject your own CSS to fully personalize the application's appearance and layout.
-   **Advanced User Experience:**
    -   **Real-time Streaming:** Responses are streamed in real-time for a fluid, conversational feel.
    -   **Full Markdown Support:** An input toolbar and full rendering support for formatted messages, including tables and code blocks.
    -   **Image Lightbox:** Click any generated image to view it in a full-screen, high-resolution lightbox.
    -   **Advanced Search Filtering:** Filter results by time, including presets and custom date ranges.
    -   **Smart Suggestions:** AI-powered suggestions for follow-up questions and related topics.
-   **Comprehensive Chat Management:**
    -   **Persistent History:** Conversations, tasks, and recent queries are saved locally for continuity.
    -   **Summarization, Copy & Export:** Summarize your chat, copy individual messages or the full transcript, and export conversations as JSON.
    -   **Feedback Mechanism:** Rate model responses with thumbs-up/down.
    -   **Clear & New Chat:** Easily start a new conversation with dedicated buttons.
-   **Customization & Security:**
    -   **Theming Engine:** Personalize your experience with multiple built-in themes (e.g., Abyss, Daylight, Twilight, Latte).
    -   **Secure API Key Flow:** An integrated process for users to select their own billed API key, required for video generation.
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

Simply type your question in the input box and press Enter. The assistant will provide a grounded answer. Use the toolbar or markdown syntax to format your message. Your most recent searches are displayed on the initial chat screen, allowing you to click and re-run them instantly. You can clear this history at any time.

-   **Deep Research:** For more complex queries, click the **sparkles icon** ✨ in the input bar to activate Deep Research mode. This will use the more powerful Gemini 2.5 Pro model for your next message to provide a more comprehensive response.

### Productivity & Customization

-   **To-Do List:** Click the **checklist icon** ☑️ in the header to open your personal to-do list. Add, complete, and delete tasks. Your list is saved in your browser.
-   **Custom CSS:** Click the **code file icon** 📄 in the header to open the custom CSS editor. Add your own styles to personalize the app's look and feel. Your styles are saved locally.

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
