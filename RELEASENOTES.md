# Release Notes: Conversational Search

This document tracks the major changes, new features, and improvements for the Conversational Search application.

---

## Version 3.0.0 - The Anthropic Integration

This major release adds support for Anthropic's Claude models, evolving the application into a comprehensive tri-provider AI toolkit. Users can now leverage the unique strengths of models from Google, OpenAI, and Anthropic in one unified interface.

### ✨ New Features

-   **Anthropic Model Integration:** Full support for Anthropic's state-of-the-art chat models has been added:
    -   **Claude 3.5 Sonnet:** Anthropic's latest, most intelligent model, offering top-tier performance at high speeds.
    -   **Claude 3 Opus:** A highly powerful model for tackling complex, multi-step tasks.
    -   **Claude 3 Haiku:** The fastest and most compact model for near-instant responsiveness.
-   **Multi-modal Support for Claude:** Attach images to your prompts to leverage the powerful vision capabilities of the Claude 3 model family.
-   **Tri-Provider API Key Management:** The API Key Manager now includes a dedicated section for Anthropic. Users can enter and save their Anthropic API key, which is stored securely in their browser's local storage.
-   **Expanded Provider-Aware UI:**
    -   The **Model Selector** now features three tabs for Google, OpenAI, and Anthropic, allowing for quick and easy switching between providers. The Anthropic tab is enabled after a key is configured.
    -   The UI intelligently disables features not supported by Anthropic, such as `/imagine`, `/create-video`, search filters, and deep research mode, ensuring a clean and accurate user experience.

### 🚀 Improvements

-   **Generalized AI Service Layer:** The core service logic has been further modularized to seamlessly handle API requests and streaming responses from all three providers.
-   **Dynamic UI Content:** The welcome message and initial example prompts now adjust to reflect the capabilities of the selected Anthropic model.
-   **Updated Documentation:** The `README.md` and all relevant user guides have been updated to include instructions for configuring and using the new Anthropic models.

---

## Version 2.0.0 - The Multi-Provider Update

This major update introduces support for OpenAI models, transforming the application into a versatile, dual-provider AI tool. Users can now seamlessly switch between Google's and OpenAI's flagship models.

### ✨ New Features

-   **OpenAI Model Integration:** Full support for OpenAI's chat models has been added, including:
    -   **GPT-4o:** The latest, most advanced, and fastest model from OpenAI.
    -   **GPT-4 Turbo:** High-performance model for large-scale tasks.
    -   **GPT-3.5 Turbo:** A fast and cost-effective option for standard chat.
-   **DALL-E 3 Image Generation:** The `/imagine` command now uses DALL-E 3 when an OpenAI model is selected, offering a new dimension of creative and illustrative image generation.
-   **Dual API Key Management:** The API Key Manager has been redesigned to handle both Google and OpenAI keys separately. Users can now enter and save their OpenAI API key, which is stored securely in their browser's local storage.
-   **Provider-Aware UI:**
    -   The **Model Selector** now features a tabbed interface to easily switch between Google and OpenAI models. The OpenAI tab is only enabled after a key has been entered.
    -   Google-specific features like **Date Filtering** and **Deep Research Mode** are automatically disabled in the UI when an OpenAI model is active, preventing confusion and ensuring a clean user experience.
-   **Unified Multi-modal Input:** Image understanding (vision) is supported for all capable models, including Gemini and GPT-4o.

### 🚀 Improvements

-   **Refactored AI Service Layer:** The backend service logic has been abstracted to cleanly handle API calls to either Google or OpenAI based on the user's selection.
-   **Dynamic Initial Prompts:** The initial welcome message and example prompts now dynamically adjust based on the selected model provider, correctly advertising available features (e.g., hiding `/create-video` for OpenAI).
-   **Updated Documentation:** The `README.md` has been extensively updated to reflect the new dual-provider architecture, setup instructions for both API keys, and usage differences between the model families.

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
-   **Autosave Draft:** Your message draft is automatically saved in the text input area.
-   **Persistent History:** Your chat history, to-do list, and preferences are saved locally in your browser.
-   **Copy & Share:** Easily copy individual messages or the full conversation transcript.

#### 4. Customization & User Experience
-   **Theming Engine:** Personalize the UI with multiple built-in themes.
-   **Custom CSS Editor:** A dedicated modal for power users to inject their own CSS for complete visual customization.
-   **Smart Text Editor:** Full Markdown support with a formatting toolbar, live preview, and smart editing features.
-   **Voice Input (Speech-to-Text):** Use your microphone to dictate prompts.
-   **Text-to-Speech:** Listen to any model response with a dedicated read-aloud button.
-   **Image Lightbox:** View generated or embedded images in a full-screen, high-resolution lightbox.
-   **AI-Powered Suggestions:** Receive suggestions for relevant follow-up questions and related topics.
-   **Keyboard Shortcuts:** A full suite of keyboard shortcuts for power users, with a helpful guide accessible via the `?` key.

### 🚀 Improvements

-   **Real-time Streaming:** AI responses are streamed word-by-word for a fluid, interactive feel.
-   **Robust Error Handling:** Clear, user-friendly error messages for API key issues, rate limits, or safety blocks, with a "Retry" option.
-   **Secure API Key Flow:** An integrated, secure modal for selecting a billed API key, required for advanced features like video generation.
-   **Responsive Design:** Fully responsive and functional across desktop and mobile devices.
-   **Accessibility:** ARIA attributes, focus management in modals, and keyboard navigation are implemented.
-   **Internationalization (i18n):** The UI text is translated based on the user's browser language (supports EN, ES).