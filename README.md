# Gemini Conversational Search

This is a powerful, feature-rich conversational search tool powered by the Google Gemini API. It leverages Google Search grounding for up-to-date, accurate information and integrates advanced generative AI capabilities for creating images and videos, providing a truly interactive and multi-modal experience.

## Key Features

-   **Grounded Conversational Search:** Get reliable answers with sources cited directly from Google Search.
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
    -   **Copy to Clipboard:** Easily copy individual messages, code blocks, or the entire chat transcript.
    -   **Feedback Mechanism:** Rate model responses with thumbs-up/down.
-   **Secure API Key Flow:** An integrated and secure process for users to select their own billed API key, required for video generation.
-   **Polished & Responsive UI:** A clean, modern interface that works seamlessly across all devices.

## How to Use

Simply type your question in the input box and press Enter. The assistant will provide a grounded answer. Use the toolbar or markdown syntax to format your message.

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


## How to Run This Solution

1.  **Configure API Key:**
    *   This application requires a Google Gemini API key. Obtain your key from [Google AI Studio](https://ai.google.dev/).
    *   Set the key as an environment variable named `API_KEY` in your deployment environment. Most features, like search and image generation, will use this key.

2.  **Run the Application:**
    *   This project is a standard static web application. Deploy it to your preferred hosting service or run it with any local static file server.

3.  **Enable Video Generation:**
    *   The `/create-video` feature uses the Veo model, which requires a billed API key.
    *   When you first use this command, a pop-up will appear prompting you to select an API key from a Google Cloud project where billing is enabled. This is a secure, one-time setup step within the app.
