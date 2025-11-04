# Release Notes: Conversational Search

This document tracks the major changes, new features, and improvements for the Conversational Search application.

---

## **Version 3.0.0** — The Anthropic Integration `LATEST`

This major release adds support for Anthropic's Claude models, evolving the application into a comprehensive tri-provider AI toolkit. Users can now leverage the unique strengths of models from Google, OpenAI, and Anthropic in one unified interface.

### ✨ New Features
- **Anthropic Model Integration**: Introduced full support for Anthropic's state-of-the-art chat models:
    - **Claude 3.5 Sonnet**: Anthropic's latest, most intelligent model, offering top-tier performance at high speeds.
    - **Claude 3 Opus**: The highest-performance model for tackling highly complex, multi-step tasks.
    - **Claude 3 Haiku**: The fastest and most compact model for near-instant responsiveness.
- **Multi-modal Support for Claude**: Attach images to your prompts to leverage the powerful vision capabilities of the **Claude 3** model family.
- **Tri-Provider API Key Management**: The **API Key Manager** now includes a dedicated section for Anthropic. Users can enter and save their Anthropic API key, which is stored securely in their browser's local storage.

### 🚀 Improvements
- **Expanded Provider-Aware UI**:
    - The **Model Selector** now features three tabs for Google, OpenAI, and Anthropic, allowing for quick and easy switching between providers. The Anthropic tab is enabled after a key is configured.
    - The UI intelligently disables features not supported by Anthropic (such as `/imagine`, `/create-video`, search filters, and deep research mode) for a clean and accurate user experience.
- **Generalized AI Service Layer**: The core service logic has been further modularized to seamlessly handle API requests and streaming responses from all three providers.
- **Dynamic UI Content**: The welcome message and initial example prompts now adjust to reflect the capabilities of the selected Anthropic model.
- **Updated Documentation**: The `README.md` and all relevant user guides have been updated to include instructions for configuring and using the new Anthropic models.

---

## Version 2.0.0 — The Multi-Provider Update

This major update introduced support for OpenAI models, transforming the application into a versatile, dual-provider AI tool. Users can now seamlessly switch between Google's and OpenAI's flagship models.

### ✨ New Features
- **OpenAI Model Integration**: Added full support for OpenAI's powerful chat models, including:
    - **GPT-4o**: The latest, most advanced, and fastest model from OpenAI.
    - **GPT-4 Turbo**: A high-performance model for large-scale tasks.
    - **GPT-3.5 Turbo**: A fast and cost-effective option for standard chat.
- **DALL-E 3 Image Generation**: The `/imagine` command now uses **DALL-E 3** when an OpenAI model is selected, offering a new dimension of creative and illustrative image generation.
- **Dual API Key Management**: The **API Key Manager** was redesigned to handle both Google and OpenAI keys separately. Users can now enter and save their OpenAI API key in local storage.
- **Unified Multi-modal Input**: Image understanding (vision) is supported for all capable models, including Gemini and GPT-4o.

### 🚀 Improvements
- **Provider-Aware UI**:
    - The **Model Selector** was updated with a tabbed interface to easily switch between Google and OpenAI models.
    - Google-specific features like **Date Filtering** and **Deep Research Mode** are automatically disabled when an OpenAI model is active.
- **Refactored AI Service Layer**: The backend service logic was abstracted to cleanly handle API calls to either Google or OpenAI based on the user's selection.
- **Dynamic Initial Prompts**: The initial welcome message and example prompts now dynamically adjust based on the selected model provider.
- **Updated Documentation**: The `README.md` was extensively updated to reflect the new dual-provider architecture and setup instructions.

---

## Version 1.0.0 — Initial Release

This is the inaugural release of the Conversational Search application, a powerful and feature-rich tool built on the Google Gemini API.

### ✨ Key Features

- **Core AI & Search**:
    - Conversational search with **Google Search Grounding** for cited, up-to-date answers.
    - Support for **Gemini 2.5 Flash** and **Gemini 2.5 Pro**.
    - **Deep Research Mode** with predefined analysis scopes.
    - Advanced search filtering by date.
- **Multi-Modal Interaction**:
    - Image generation with `/imagine` powered by **Imagen**.
    - Video generation with `/create-video` powered by **Veo**.
    - Image understanding via file attachments.
- **Productivity & Chat Management**:
    - AI-powered conversation summaries (`/summarize`).
    - Chat export to TXT, JSON, and Markdown.
    - Integrated To-Do List, Recent Queries, and autosaving drafts.
- **Customization & User Experience**:
    - Theming engine with a **Custom CSS Editor**.
    - Smart Markdown editor with live preview and voice input.
    - AI-powered suggestions for follow-up prompts and related topics.
    - Full suite of keyboard shortcuts.
- **Technical Excellence**:
    - Real-time streaming for fluid responses.
    - Robust, user-friendly error handling.
    - Secure API key flow for billed features.
    - Fully responsive and accessible design.
