# Conversational Search

This is a powerful, feature-rich conversational search tool powered by the Google Gemini API. It leverages Google Search grounding for up-to-date, accurate information and integrates advanced generative AI capabilities for creating images and videos, providing a truly interactive and multi-modal experience.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Special Commands](#special-commands)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Prompt Engineering Tips](#prompt-engineering-tips)
  - [General Tips for Text Generation](#general-tips-for-text-generation)
  - [Image Generation (`/imagine`)](#image-generation-imagine)
  - [Video Generation (`/create-video`)](#video-generation-create-video)
  - [Using Markdown for Structured Prompts](#using-markdown-for-structured-prompts)

## Key Features

-   **Grounded Conversational Search:** Get reliable answers with sources cited directly from Google Search.
-   **Model Selection:** Switch between Gemini 2.5 Flash (for speed) and Gemini 2.5 Pro (for complex tasks) to suit your needs.
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

This project is a standard static web application and can be run in any environment that serves static files.

### Prerequisites

1.  **Obtain a Google Gemini API Key:** You'll need an API key from [Google AI Studio](https://ai.google.dev/).
2.  **Set Environment Variable:** Set your key as an environment variable named `API_KEY` in your deployment environment. Most features, like search and image generation, will use this key.

### Running the Application

1.  Deploy the project files (HTML, TSX, etc.) to your preferred hosting service (like Vercel, Netlify, or a simple web server).
2.  Ensure the `API_KEY` environment variable is correctly configured in the hosting environment.
3.  Access the deployed URL to start using the application.

### Enabling Video Generation

The `/create-video` feature uses the Veo model, which requires a billed API key. When you first use this command, a pop-up will appear prompting you to select an API key from a Google Cloud project where billing is enabled. This is a secure, one-time setup step managed within the AI Studio environment.

## Usage

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
| `?`               | Show keyboard shortcuts       |

## Prompt Engineering Tips

Crafting effective prompts is key to unlocking the full potential of the generative models. Here are some tips to get better results.

### General Tips for Text Generation

-   **Be Specific and Detailed:** The more detail you provide, the better the model can understand your intent.
    -   **Vague:** `Tell me about space.`
    -   **Better:** `Explain the concept of a black hole to a 12-year-old, using a simple analogy.`
-   **Provide Context and Persona:** Tell the model who it should be or what context it should operate in.
    -   **Vague:** `Write about a new product.`
    -   **Better:** `You are a marketing expert. Write a short, exciting announcement for a new smartphone with a revolutionary camera. The target audience is tech enthusiasts.`
-   **Define the Output Format:** Explicitly ask for the format you want.
    -   **Vague:** `What are the pros and cons of coffee?`
    -   **Better:** `List the pros and cons of drinking coffee in a two-column markdown table.`

### Image Generation (`/imagine`)

-   **Use Descriptive Adjectives:** Combine subjects with rich adjectives to guide the visual details.
    -   **Simple:** `/imagine a cat`
    -   **Better:** `/imagine a fluffy, mischievous ginger tabby cat, with bright green eyes, playfully chasing a laser dot.`
-   **Specify Styles and Mediums:** Mention artistic styles, mediums, or artists to influence the look and feel.
    -   **Style:** `/imagine a futuristic city skyline at night, cyberpunk, neon-drenched, Blade Runner style`
    -   **Medium:** `/imagine a tranquil mountain lake surrounded by pine trees, watercolor painting, impressionistic`
    -   **Rendering:** `/imagine a cute, friendly robot waving, 3D render, Pixar animation style`
-   **Set the Scene:** Describe the environment, lighting, and camera angle.
    -   **Lighting:** `/imagine a medieval knight in shining armor, dramatic cinematic lighting, golden hour`
    -   **Angle:** `/imagine a tiny mouse eating a piece of cheese, macro shot, shallow depth of field`

### Video Generation (`/create-video`)

-   **Focus on Action and Movement:** Video prompts excel when they describe a scene with clear motion.
    -   **Static:** `/create-video a beautiful beach`
    -   **Better:** `/create-video waves gently crashing on a pristine tropical beach at sunset, with palm trees swaying in the breeze.`
-   **Describe Camera Work:** Use terms like "time-lapse," "slow motion," or "aerial shot" for more dynamic results.
    -   **Example:** `/create-video a time-lapse of a busy city street, with car light trails and pedestrians hurrying`
    -   **Example:** `/create-video an eagle soaring over a grand canyon, aerial drone footage, slow motion`
-   **Combine Subjects and Actions:** Clearly state who or what is doing the action.
    -   **Example:** `/create-video a chef skillfully tossing pizza dough in a rustic Italian kitchen`

### Using Markdown for Structured Prompts

For complex requests, use markdown in the chat input to structure your prompt. This helps the model differentiate between instructions, context, and the data it needs to work with.

**Example Template:**

```markdown
You are an expert travel planner. Create a concise, 3-day itinerary based on the following details.

---
**Destination:** Paris, France
**Traveler Profile:** A couple on their honeymoon, interested in art and food.
**Budget:** Moderate
**Tone:** Romantic and enthusiastic
---

Generate the itinerary now.
```

This structured approach is much clearer than writing a single, long paragraph and often leads to more accurate and well-formatted responses.
