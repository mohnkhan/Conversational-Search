
# Gemini Conversational Search

This is a powerful, feature-rich conversational search tool powered by the Google Gemini API. It leverages Google Search grounding for up-to-date, accurate information and integrates advanced generative AI capabilities for creating images and videos, providing a truly interactive and multi-modal experience.

## Key Features

- **Grounded Conversational Search:** Get reliable answers with sources cited directly from Google Search.
- **Real-time Streaming:** Responses are streamed in real-time for a fluid, conversational feel.
- **Multi-modal Generation:**
    - **Image Generation:** Create stunning, high-quality images using the `/imagine` command.
    - **Video Generation:** Generate short, 720p videos from text prompts using the `/create-video` command.
- **Image Lightbox:** Click any generated image to view it in a full-screen, high-resolution lightbox.
- **Advanced Search Filtering:** Filter results by time, including presets (past day, week, etc.) and custom date ranges.
- **Smart Suggestions:** AI-powered suggestions for follow-up questions and related topics to guide your exploration.
- **Chat Utilities:**
    - Persistent chat history saved locally.
    - Conversation summarization.
    - Copy individual messages, code blocks, or the entire chat.
    - Keyboard shortcuts for efficiency (`Ctrl+K` to clear, `F` to open filters).
- **Secure API Key Flow:** An integrated and secure process for users to select their own billed API key, required for video generation.

## How to Use

Simply type your question in the input box and press Enter. The assistant will provide a grounded answer.

### Special Commands:

-   **/imagine &lt;prompt&gt;**: Creates an image based on the text prompt that follows.
    -   *Example:* `/imagine a majestic lion wearing a crown, cinematic lighting`
-   **/create-video &lt;prompt&gt;**: Creates a short video based on the text prompt. This requires selecting a billed API key.
    -   *Example:* `/create-video a hummingbird flying in slow motion`

---

## Release Notes

### Version 1.0.0 - Initial Release

This marks the first major release of the Gemini Conversational Search application, packed with a robust set of features for search, content generation, and user interaction.

#### ✨ **Core Features**

-   **Conversational Search:** Engage in natural language conversations to get up-to-date, accurate information, grounded by Google Search.
-   **Streaming Responses:** See answers appear in real-time for a fluid and interactive experience.
-   **Source Attribution:** All grounded responses include clickable source links for verification and further reading.
-   **Persistent Chat History:** Conversations are automatically saved to your browser's local storage for continuity between sessions.

#### 🚀 **Generative AI Capabilities**

-   **Image Generation:** Use the `/imagine <prompt>` command to create high-quality images powered by the Imagen 4 model.
-   **Video Generation:** Bring ideas to life with the `/create-video <prompt>` command, powered by the state-of-the-art Veo model.
-   **Smart Suggestions:** Discover AI-generated follow-up questions and related topics to deepen your exploration after receiving a response.
-   **Conversation Summary:** Instantly generate a concise summary of your current chat session with a single click.

#### 🖼️ **Enhanced User Experience**

-   **Image Lightbox:** Click on any generated image to view a larger, high-resolution version in a sleek, dismissible lightbox modal. This allows for detailed inspection of generated artwork.
-   **Advanced Filtering:** Narrow down your search results by time with predefined filters (past day, week, month) or use the custom date range picker for precise control.
-   **Secure API Key Flow:** A dedicated and user-friendly modal ensures users select a valid, billed API key before using the premium video generation feature, as required by the Veo model.
-   **Polished Interface:** Enjoy a fully responsive design, intuitive icons, informative loading indicators, and helpful tooltips for a seamless experience on any device.

#### 🛠️ **Utility & Convenience**

-   **Chat Management:** Easily copy individual messages, formatted code blocks, or the entire conversation transcript to your clipboard.
-   **Keyboard Shortcuts:** Use `Ctrl+K` to clear the chat and `F` to toggle the filter menu for faster navigation and a power-user feel.
-   **Feedback Mechanism:** Provide feedback on model responses with thumbs-up/down icons to help track response quality.
