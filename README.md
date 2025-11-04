# Conversational Search

An all-in-one conversational AI toolkit that unifies the power of Google, OpenAI, and Anthropic's flagship models into a single, elegant interface. Go beyond simple chat with advanced search grounding, multi-modal generation, and a suite of productivity tools designed for power users.

<!-- [A screenshot or GIF of the application in action would be ideal here.] -->

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [How to Use](#how-to-use)
- [Special Commands](#special-commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Release History](#release-history)
- [Contributing](#contributing)
- [License](#license)

## Core Philosophy

This project is built on three core principles:

-   **Unified Interface:** Stop switching between different AI services. Access the best models from top providers in one place.
-   **Best-in-Class Features:** Leverage unique, powerful features from each provider, like Google's search grounding and video generation, OpenAI's DALL-E 3, and Anthropic's best-in-class large context models.
-   **User-Centric Tools:** A conversational interface is just the beginning. This app is packed with productivity features like a to-do list, chat export, and deep customization to enhance your workflow.

## Key Features

-   **Multi-Provider AI Engine:** Instantly switch between Google (Gemini 2.5 Pro/Flash), OpenAI (GPT-4o/Turbo), and Anthropic (Claude 3.5 Sonnet/Opus/Haiku).
-   **Advanced Search & Grounding (Google):** Get reliable, up-to-date answers with cited sources from Google Search. Engage **Deep Research Mode** to task Gemini 2.5 Pro with specific analysis scopes (e.g., *Pros & Cons*, *Historical Context*).
-   **Generative Multi-Modal Suite:**
    -   **Image Generation:** Create stunning visuals with `/imagine` using **DALL-E 3** (OpenAI) or **Imagen** (Google).
    -   **Video Generation:** Bring prompts to life with short, 720p videos using `/create-video` powered by Google's **Veo** model.
    -   **Image Understanding:** Upload images to have a conversation about them with Gemini, GPT-4o, and Claude 3 models.
-   **Productivity & Workflow Tools:**
    -   **Integrated To-Do List:** Capture and manage tasks without leaving the chat.
    -   **Chat Summary & Export:** Get AI-powered summaries and export conversations to TXT, JSON, or Markdown.
    -   **Persistent History & Drafts:** Your conversations, tasks, and message drafts are saved locally.
-   **Deep Customization & UX:**
    -   **Custom CSS & Themes:** Tailor the app's appearance with a powerful CSS editor and multiple built-in themes.
    -   **Smart Input:** A full-featured Markdown editor with a formatting toolbar, live preview, and voice input (speech-to-text).
    -   **AI-Powered Suggestions:** Discover new avenues of exploration with context-aware follow-up prompts and related topics.

## Technology Stack

-   **Frontend:** [React](https://react.dev/) (with Hooks) & [TypeScript](https://www.typescriptlang.org/)
-   **AI:**
    -   [Google Gemini API](https://ai.google.dev/gemini-api) (`@google/genai`)
    -   [OpenAI API](https://platform.openai.com/docs/api-reference)
    -   [Anthropic Claude API](https://docs.anthropic.com/claude/reference/messages_post)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Markdown:** [React Markdown](https://github.com/remarkjs/react-markdown) with [Remark GFM](https://github.com/remarkjs/remark-gfm)
-   **Syntax Highlighting:** [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
-   **Internationalization (i18n):** Built-in support for multiple languages (EN, ES).

## Getting Started

### Prerequisites

To unlock all features, you will need API keys from:
-   [Google AI Studio](https://ai.google.dev/)
-   [OpenAI Platform](https://platform.openai.com/)
-   [Anthropic Console](https://console.anthropic.com/)

### API Key Configuration

This application uses a multi-key system for maximum flexibility and security.

#### 1. Standard Google API Key (Text, Search, Images)
-   **Purpose:** Powers standard Gemini chat, search grounding, and Imagen image generation.
-   **Setup:** This key must be configured as an environment variable named `API_KEY` in your deployment environment.

#### 2. Billed Google Project API Key (Video Generation)
-   **Purpose:** Required for the `/create-video` feature, which uses the Veo model.
-   **Setup:** When you first use this command, a secure pop-up from AI Studio will prompt you to select a key from a Google Cloud project with billing enabled.

#### 3. OpenAI & Anthropic API Keys
-   **Purpose:** Required to use any of the OpenAI (GPT) or Anthropic (Claude) models.
-   **Setup:** Inside the app, navigate to **Settings -> API Key Manager**. Enter your keys here; they will be stored securely in your browser's local storage.

### Deployment

1.  **Deploy the Application:** Host the static project files (HTML, TSX, etc.) on your preferred service (e.g., Vercel, Netlify, or a simple web server).
2.  **Configure Environment Variable:** In your hosting service's settings, set your standard Google Gemini API Key as an environment variable named `API_KEY`.
3.  **Launch & Configure:** Open the deployed URL. Go to the API Key Manager to add your OpenAI and Anthropic keys to unlock all models.

## How to Use

-   **Select Your Model:** Use the **Settings -> Model & Settings** menu to choose your AI provider and the specific model you want to use.
-   **Start Chatting:** Type your question, use the microphone for voice input, or try an example prompt.
-   **Work with Images:** Click the **paperclip icon** 📎 to upload an image. You can then ask questions about it (e.g., "What kind of car is this?") or use it as context for another task (e.g., "Write a story inspired by this picture.").
-   **Use Deep Research (Google Only):** For complex queries, click the **sparkles icon** ✨ next to the input bar to activate Deep Research mode. Select an analysis type (like "Compare & Contrast") before sending your message to get a highly structured, in-depth response.
-   **Access Productivity Tools:** The settings menu (gear icon ⚙️) is your hub for the To-Do List, Custom CSS editor, Theme selector, and Chat Export.

### Special Commands

Type these commands directly into the chat input:

-   `/imagine <prompt>`: **(Google & OpenAI)** Creates an image. Uses DALL-E 3 for OpenAI and Imagen for Google.
-   `/create-video <prompt>`: **(Google Only)** Creates a short video. Requires a billed API key.
-   `/summarize`: **(All Providers)** Generates a summary of the current conversation.

### Keyboard Shortcuts

A list of keyboard shortcuts for power users. *Use `Cmd` instead of `Ctrl` on macOS.*

| Shortcut          | Action                        |
| :---------------- | :---------------------------- |
| `Enter`           | Send message                  |
| `Shift` + `Enter` | Add a new line                |
| `Ctrl` + `K`      | Clear the entire chat         |
| `F`               | Toggle search filter menu (Google Only) |
| `Ctrl` + `B`      | Apply **bold** formatting     |
| `Ctrl` + `I`      | Apply *italic* formatting     |
| `Ctrl` + `E`      | Apply `inline code` formatting |
| `Esc`             | Close modals (Summary, Lightbox, etc.) |
| `?`               | Show keyboard shortcuts       |

## Troubleshooting

-   **API Key Errors:** If you see an error about an invalid API key, double-check that you have entered it correctly in the API Key Manager. For Google models, ensure your standard key is set as the `API_KEY` environment variable.
-   **Video Generation Fails:** This is almost always a billing issue. Ensure the Google Cloud project associated with your selected key has billing enabled and the Vertex AI API is active.
-   **Model Not Available:** If an OpenAI or Anthropic model is disabled, it means you haven't set the corresponding API key in the API Key Manager.

## Roadmap

-   Support for additional models as they are released.
-   Enhanced chat export options.
-   In-app prompt library for saving and reusing your favorite prompts.

## Release History

For a detailed list of changes, new features, and improvements in each version, please see the [Release Notes](./RELEASENOTES.md).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
