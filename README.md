# Conversational Search

A powerful, feature-rich conversational search tool powered by the Google Gemini, OpenAI, and Anthropic Claude APIs. It leverages Google Search grounding for up-to-date, accurate information and integrates advanced generative AI capabilities for creating images, videos, and understanding user-uploaded images, providing a truly interactive and multi-modal experience.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Special Commands](#special-commands)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Prompt Engineering Tips](#prompt-engineering-tips)
- [Release History](#release-history)
- [Contributing](#contributing)
- [License](#license)

## Key Features

### Core AI & Search
-   **Tri-Provider AI Engine:** Seamlessly switch between top-tier models from **Google** (Gemini 2.5 Pro, Gemini 2.5 Flash), **OpenAI** (GPT-4o, GPT-4 Turbo), and **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus).
-   **Grounded Conversational Search (Google):** Get reliable answers with sources cited directly from Google Search when using Gemini models.
-   **Deep Research Mode (Google):** Instantly engage Gemini 2.5 Pro for in-depth answers. Activate specific analysis scopes like *Comprehensive Analysis*, *Pros & Cons*, *Historical Context*, *Compare & Contrast*, and *Technical Deep-Dive*.
-   **Advanced Search Filtering (Google):** Filter results by time using presets (past day, week, month, year) or a custom date range.
-   **Authoritative Source Prioritization (Google):** A toggle to guide Gemini models to prefer academic, governmental, and other high-quality sources.

### Multi-modal Capabilities
-   **Image Generation:**
    -   **DALL-E 3 (OpenAI):** Create vibrant, highly creative images with the `/imagine` command.
    -   **Imagen (Google):** Generate stunning, high-quality photorealistic images.
-   **Video Generation (Google):** Generate short, 720p videos from text prompts using the `/create-video` command with Veo.
-   **Image Understanding:** Attach images to your prompts to ask questions about them or use them as context for your queries with Gemini, GPT-4o, and Claude 3 models.

### Productivity & Customization
-   **Integrated To-Do List:** Manage tasks that arise during your conversation directly within a dedicated modal. Your tasks are saved locally.
-   **Recent Search History:** Automatically saves your last 5 queries, allowing you to quickly revisit or re-run past searches.
-   **Custom CSS Editor:** Inject your own CSS to fully personalize the application's appearance and layout.
-   **Theming Engine:** Personalize your experience with multiple built-in themes (e.g., Abyss, Daylight, Twilight, Latte).
-   **Autosave Draft:** Your message draft is automatically saved, so you won't lose it if you accidentally refresh the page.

### Advanced User Experience
-   **Real-time Streaming:** Responses are streamed in real-time for a fluid, conversational feel.
-   **Smart Text Editor:** Full Markdown support with a formatting toolbar, live preview, and smart features like auto-completing lists and brackets.
-   **Voice & Audio:** Use your microphone to dictate prompts (speech-to-text) and listen to the AI's responses with a single click (text-to-speech).
-   **Image Lightbox:** Click any generated image to view it in a full-screen, high-resolution lightbox.
-   **AI-Powered Suggestions:** Receive AI-generated suggestions for follow-up questions and related topics to explore from your selected model.

### Comprehensive Chat Management
-   **Persistent History:** Conversations, tasks, and recent queries are saved locally for continuity.
-   **Summarization & Copying:** Summarize your chat on-demand or copy individual messages/the full transcript.
-   **Chat Export:** Export your entire conversation history to TXT, JSON, or Markdown formats for easy sharing or archiving.
-   **Feedback Mechanism:** Rate model responses with thumbs-up/down to track quality.

### Secure API Key Management
-   **Multi-Key System:** A secure, unified manager for Google, OpenAI, and Anthropic API keys.
    -   **OpenAI & Anthropic Keys:** Enter and save your keys directly in the manager. They are stored only in your browser's local storage.
    -   **Google Billed Key (for Video):** A secure process for users to select their own billed API key via the AI Studio pop-up.

## Technology Stack

-   **Frontend:** [React](https://react.dev/) (with Hooks) & [TypeScript](https://www.typescriptlang.org/)
-   **AI:**
    - [Google Gemini API](https://ai.google.dev/gemini-api) (`@google/genai`)
    - [OpenAI API](https://platform.openai.com/docs/api-reference)
    - [Anthropic Claude API](https://docs.anthropic.com/claude/reference/messages_post)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Markdown:** [React Markdown](https://github.com/remarkjs/react-markdown) with [Remark GFM](https://github.com/remarkjs/remark-gfm)
-   **Syntax Highlighting:** [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
-   **Internationalization (i18n):** Built-in support for multiple languages (EN, ES).

## Getting Started

This project is a static web application and can be run in any environment that serves static files.

### Prerequisites

You will need API Keys from [Google AI Studio](https://ai.google.dev/), the [OpenAI Platform](https://platform.openai.com/), and [Anthropic](https://console.anthropic.com/). For video generation with Google, your key must be associated with a Google Cloud project that has billing enabled.

### API Key Configuration

This application uses a multi-key system:

1.  **Standard Google API Key (for Text, Search, Images):**
    -   This key is used for most Google features.
    -   It must be configured as an environment variable named `API_KEY` in your deployment environment.
    -   The application will automatically use this key for standard Gemini API calls.

2.  **Billed Google Project API Key (for Video Generation):**
    -   The `/create-video` feature uses the Veo model, which requires an API key associated with a billed Google Cloud project.
    -   When you first use this command, a secure pop-up from AI Studio will appear, prompting you to select an appropriate billed API key.

3.  **OpenAI & Anthropic API Keys:**
    -   Required to use any of the OpenAI or Anthropic models.
    -   Go to **Settings -> API Key Manager** within the app to enter and save your keys. They will be stored securely in your browser's local storage.

### Setup

1.  **Deploy the Application:** Deploy the project files (HTML, TSX, etc.) to your preferred hosting service (e.g., Vercel, Netlify, or a simple web server).
2.  **Configure Environment Variable:** Set your standard Google Gemini API Key as an environment variable named `API_KEY` in your hosting service's settings.
3.  **Access the App:** Open the deployed URL, go to the API Key Manager, and add your OpenAI and Anthropic keys to unlock all features.

## Usage

-   **Select a Model:** Use the **Settings -> Model & Settings** menu to choose your preferred AI provider (Google, OpenAI, or Anthropic) and model.
-   **Start a conversation:** Simply type your question in the input box, use voice input, or try one of the example prompts.
-   **Ask about images:** Click the **paperclip icon** 📎 to attach an image from your device. Then, type your question about the image and send the message. This works with Gemini, GPT-4o, and Claude 3 models.
-   **Format your messages:** Use the toolbar or standard Markdown syntax to format your text. Switch to the "Preview" tab to see how it will look.
-   **Use Deep Research (Google Models Only):** For complex queries, click the **sparkles icon** ✨ to activate Deep Research mode. This engages Gemini 2.5 Pro with a specific analysis goal for a more comprehensive response.
-   **Access Tools & Settings:** Use the settings menu in the top-right corner to find the To-Do List, Custom CSS editor, Theme selector, Chat Export, and more.

### Special Commands

-   `/imagine <prompt>`: (Google & OpenAI only) Creates an image based on the text prompt. Uses DALL-E 3 for OpenAI models and Imagen for Google models.
    -   *Example:* `/imagine a majestic lion wearing a crown, cinematic lighting`
-   `/create-video <prompt>`: (Google only) Creates a short video based on the text prompt. Requires selecting a billed API key.
    -   *Example:* `/create-video a hummingbird flying in slow motion`
-   `/summarize`: Generates a summary of the current conversation using the active model.

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


## Prompt Engineering Tips

Crafting effective prompts is key to unlocking the full potential of the generative models.

-   **Be Specific and Detailed:** The more detail you provide, the better the model can understand your intent. (e.g., `Explain the concept of a black hole to a 12-year-old` vs. `Tell me about space`).
-   **Provide Context and Persona:** Tell the model who it should be. (e.g., `You are a marketing expert. Write an announcement for a new smartphone...`).
-   **Define the Output Format:** Explicitly ask for the format you want. (e.g., `List the pros and cons of coffee in a two-column markdown table`).
-   **For Images (`/imagine`):**
    -   **DALL-E 3:** Tends to be more creative and illustrative. Try whimsical or abstract prompts.
    -   **Imagen:** Excels at photorealism and cinematic styles. Use descriptive adjectives and specify lighting (e.g., `dramatic cinematic lighting`, `golden hour`).
-   **For Videos (`/create-video`):** Focus on action and movement in your prompts. Use dynamic verbs and camera terms like `a hummingbird flying in slow motion`, `a time-lapse of a flower blooming`, or `an aerial shot of a coastline`.

## Release History

For a detailed list of changes, new features, and improvements in each version, please see the [Release Notes](./RELEASENOTES.md).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.