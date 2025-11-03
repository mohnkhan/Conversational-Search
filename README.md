# Conversational Search

A powerful, feature-rich conversational search tool powered by the Google Gemini API. It leverages Google Search grounding for up-to-date, accurate information and integrates advanced generative AI capabilities for creating images, videos, and understanding user-uploaded images, providing a truly interactive and multi-modal experience.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Special Commands](#special-commands)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Prompt Engineering Tips](#prompt-engineering-tips)
- [Contributing](#contributing)
- [License](#license)

## Key Features

### Core AI & Search
-   **Grounded Conversational Search:** Get reliable answers with sources cited directly from Google Search.
-   **Dual-Model Support & Deep Research:**
    -   **Model Selection:** Manually switch between Gemini 2.5 Flash (for speed) and Gemini 2.5 Pro (for complex tasks).
    -   **Deep Research Mode:** Instantly engage the more powerful Gemini 2.5 Pro model for in-depth answers. Activate specific analysis scopes like *Comprehensive Analysis*, *Pros & Cons*, *Historical Context*, *Compare & Contrast*, and *Technical Deep-Dive*.
-   **Advanced Search Filtering:** Filter results by time using presets (past day, week, month, year) or a custom date range.
-   **Authoritative Source Prioritization:** A toggle to guide the model to prefer academic, governmental, and other high-quality sources, while filtering out common social media and blog sites.

### Multi-modal Capabilities
-   **Image Generation:** Create stunning, high-quality images using the `/imagine` command with Imagen.
-   **Video Generation:** Generate short, 720p videos from text prompts using the `/create-video` command with Veo.
-   **Image Understanding:** Attach images to your prompts to ask questions about them or use them as context for your queries.

### Productivity & Customization
-   **Integrated To-Do List:** Manage tasks that arise during your conversation directly within a dedicated modal. Your tasks are saved locally.
-   **Recent Search History:** Automatically saves your last 5 queries, allowing you to quickly revisit or re-run past searches.
-   **Custom CSS Editor:** Inject your own CSS to fully personalize the application's appearance and layout.
-   **Theming Engine:** Personalize your experience with multiple built-in themes (e.g., Abyss, Daylight, Twilight, Latte).

### Advanced User Experience
-   **Real-time Streaming:** Responses are streamed in real-time for a fluid, conversational feel.
-   **Smart Text Editor:** Full Markdown support with a formatting toolbar, live preview, and smart features like auto-completing lists and brackets.
-   **Voice & Audio:** Use your microphone to dictate prompts (speech-to-text) and listen to the AI's responses with a single click (text-to-speech).
-   **Image Lightbox:** Click any generated image to view it in a full-screen, high-resolution lightbox.
-   **AI-Powered Suggestions:** Receive AI-generated suggestions for follow-up questions and related topics to explore.

### Comprehensive Chat Management
-   **Persistent History:** Conversations, tasks, and recent queries are saved locally for continuity.
-   **Summarization & Copying:** Summarize your chat on-demand or copy individual messages/the full transcript.
-   **Chat Export:** Export your entire conversation history to TXT, JSON, or Markdown formats for easy sharing or archiving.
-   **Feedback Mechanism:** Rate model responses with thumbs-up/down to track quality.

### Secure API Key Management
-   **Integrated API Key Flow:** A secure process for users to select their own billed API key, required for features like video generation.
-   **API Key Manager:** Easily change or clear the selected billed API key.

## Technology Stack

-   **Frontend:** [React](https://react.dev/) (with Hooks) & [TypeScript](https://www.typescriptlang.org/)
-   **AI:** [Google Gemini API](https://ai.google.dev/gemini-api) (`@google/genai`)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Markdown:** [React Markdown](https://github.com/remarkjs/react-markdown) with [Remark GFM](https://github.com/remarkjs/remark-gfm)
-   **Syntax Highlighting:** [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
-   **Internationalization (i18n):** Built-in support for multiple languages (EN, ES).

## Getting Started

This project is a static web application and can be run in any environment that serves static files.

### Prerequisites

You will need a Google Gemini API Key from [Google AI Studio](https://ai.google.dev/). For video generation, this key must be associated with a Google Cloud project that has billing enabled.

### API Key Configuration

This application uses two methods for handling API keys:

1.  **Standard API Key (for Text, Search, Images):**
    -   This key is used for most features.
    -   It must be configured as an environment variable named `API_KEY` in your deployment environment.
    -   The application will automatically use this key for standard Gemini API calls.

2.  **Billed Project API Key (for Video Generation):**
    -   The `/create-video` feature uses the Veo model, which requires an API key associated with a billed Google Cloud project.
    -   When you first use this command, a secure pop-up from AI Studio will appear, prompting you to select an appropriate billed API key.
    -   This is a one-time setup step. The key is managed by the AI Studio environment and is **not** stored by this application.

### Setup

1.  **Deploy the Application:** Deploy the project files (HTML, TSX, etc.) to your preferred hosting service (e.g., Vercel, Netlify, or a simple web server).
2.  **Configure Environment Variable:** Set your standard Gemini API Key as an environment variable named `API_KEY` in your hosting service's settings.
3.  **Access the App:** Open the deployed URL in your browser to start using the application.

## Usage

Simply type your question in the input box, attach an image, or use voice input to start a conversation. The assistant will provide a grounded answer. Use the toolbar or markdown syntax to format your message. Your most recent searches are displayed on the initial chat screen, allowing you to click and re-run them instantly.

-   **Deep Research:** For more complex queries, click the **sparkles icon** ✨ in the input bar to activate Deep Research mode. This will use the more powerful Gemini 2.5 Pro model for your next message to provide a more comprehensive response.
-   **Productivity & Customization:** Access the settings menu in the top-right corner to find the To-Do List, Custom CSS editor, Theme selector, Chat Export, and more.

### Special Commands

-   `/imagine <prompt>`: Creates an image based on the text prompt that follows.
    -   *Example:* `/imagine a majestic lion wearing a crown, cinematic lighting`
-   `/create-video <prompt>`: Creates a short video based on the text prompt. This requires selecting a billed API key.
    -   *Example:* `/create-video a hummingbird flying in slow motion`
-   `/summarize`: Generates a summary of the current conversation.

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
| `Ctrl` + `E`      | Apply `inline code` formatting |
| `Esc`             | Close modals (Summary, Lightbox, etc.) |
| `?`               | Show keyboard shortcuts       |


## Prompt Engineering Tips

Crafting effective prompts is key to unlocking the full potential of the generative models.

-   **Be Specific and Detailed:** The more detail you provide, the better the model can understand your intent. (e.g., `Explain the concept of a black hole to a 12-year-old` vs. `Tell me about space`).
-   **Provide Context and Persona:** Tell the model who it should be. (e.g., `You are a marketing expert. Write an announcement for a new smartphone...`).
-   **Define the Output Format:** Explicitly ask for the format you want. (e.g., `List the pros and cons of coffee in a two-column markdown table`).
-   **For Images (`/imagine`):** Use descriptive adjectives, specify artistic styles (e.g., `cyberpunk`, `watercolor painting`), and set the scene (e.g., `dramatic cinematic lighting`, `macro shot`).
-   **For Videos (`/create-video`):** Focus on action and movement. Use camera work terms like "time-lapse," "slow motion," or "aerial shot."

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
