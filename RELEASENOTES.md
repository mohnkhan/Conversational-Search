# Release Notes: Conversational Search

This document tracks the major changes, new features, and improvements for the Conversational Search application.

---

## Version 1.0.0 - Initial Release

This is the inaugural release of the Conversational Search application, a powerful and feature-rich tool built on the Google Gemini API.

### ✨ New Features

#### 1. Core AI & Search Capabilities
-   **Conversational Search:** Engage in natural, back-and-forth conversations to find information.
-   **Google Search Grounding:** Responses are grounded with up-to-date information from Google Search, providing sources for verification.
-   **Dual-Model Support:**
    -   **Gemini 2.5 Flash:** Default model, optimized for speed and efficiency in general tasks.
    -   **Gemini 2.5 Pro:** A more powerful model for complex reasoning, accessible via manual selection or Deep Research mode.
-   **Deep Research Mode:** Activate a specialized research mode with predefined scopes (`Comprehensive Analysis`, `Pros & Cons`, `Historical Context`, `Compare & Contrast`, `Technical Deep-Dive`) to get in-depth, structured answers using Gemini 2.5 Pro.
-   **Advanced Search Filtering:** Refine searches by time with presets (past day, week, month, year) or a custom date range.
-   **Authoritative Source Prioritization:** An optional setting to guide the AI to prefer information from academic, government, and other high-quality sources.

#### 2. Multi-Modal Interaction
-   **Image Generation:** Create high-quality images directly in the chat using the `/imagine <prompt>` command, powered by the Imagen model.
-   **Video Generation:** Generate short 720p videos from text prompts using the `/create-video <prompt>` command, powered by the Veo model.
-   **Image Understanding:** Attach local image files (JPG, PNG, WEBP, etc.) to your prompts to ask questions about their content.

#### 3. Productivity & Chat Management
-   **Conversation Summary:** Instantly summarize the current conversation with a single click or the `/summarize` command.
-   **Chat Export:** Export the entire conversation history to multiple formats: Plain Text (`.txt`), JSON, or Markdown (`.md`).
-   **Integrated To-Do List:** A persistent, in-app to-do list to manage tasks that arise from your conversations.
-   **Recent Queries:** Your last five search queries are saved for quick access and re-use.
-   **Persistent History:** Your chat history, to-do list, and preferences are saved locally in your browser for session continuity.
-   **Copy & Share:** Easily copy individual messages or the full conversation transcript to your clipboard.

#### 4. Customization & User Experience
-   **Theming Engine:** Personalize the UI with multiple built-in themes, including `Abyss`, `Daylight`, `Twilight`, and `Latte`.
-   **Custom CSS Editor:** A dedicated modal for power users to inject their own CSS for complete visual customization.
-   **Smart Text Editor:**
    -   Full Markdown support for formatting messages.
    -   A formatting toolbar for easy application of **bold**, *italics*, and `code`.
    -   Live preview tab to see how your Markdown will render.
    -   Smart editing features like auto-closing brackets and continuing lists.
-   **Voice Input (Speech-to-Text):** Use your microphone to dictate prompts, with support for multiple languages based on browser settings.
-   **Text-to-Speech:** Listen to any model response with a dedicated read-aloud button.
-   **Image Lightbox:** View generated or embedded images in a full-screen, high-resolution lightbox.
-   **AI-Powered Suggestions:** After a response, the model provides suggestions for relevant follow-up questions and related topics for further exploration.
-   **Keyboard Shortcuts:** A full suite of keyboard shortcuts for power users, with a helpful guide accessible via the `?` key.

### 🚀 Improvements

-   **Real-time Streaming:** AI responses are streamed word-by-word for a fluid, interactive feel.
-   **Robust Error Handling:** Clear, user-friendly error messages for API key issues, rate limits, or safety blocks, with a "Retry" option for failed prompts.
-   **Secure API Key Flow:** An integrated, secure modal for selecting a billed API key, required for advanced features like video generation. An API Key Manager allows users to change or clear this key.
-   **Responsive Design:** The application is fully responsive and functional across desktop and mobile devices.
-   **Accessibility:** ARIA attributes, focus management in modals, and keyboard navigation are implemented to improve accessibility.
-   **Internationalization (i18n):** The UI text for key components (like the filter panel) is translated based on the user's browser language, with initial support for English and Spanish.

---
