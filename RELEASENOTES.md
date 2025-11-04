# Release Notes: Conversational Search

This document tracks the major changes, new features, and improvements for the Conversational Search application.

---

## **Version 5.0.0** — The Bedrock Expansion `LATEST`

This monumental release introduces **AWS Bedrock** as a fourth major AI provider, cementing the application's status as a premier multi-cloud AI toolkit. Users can now access an even wider array of industry-leading models, including those from Meta and Amazon, all through the same unified and powerful interface.

### ✨ New Features
- **AWS Bedrock Integration**: Full support for models hosted on AWS Bedrock. The initial release includes:
    - **Anthropic Claude 3.5 Sonnet**: The same state-of-the-art model from Anthropic, now available via AWS.
    - **Meta Llama 3 70B Instruct**: Meta's powerful, open-source flagship model.
    - **Amazon Titan Text Premier**: Amazon's most advanced and capable large language model.
- **Secure Credential Management**: A new **AWS Bedrock** section in the **API Key Manager** allows users to securely configure their AWS Region, Access Key ID, Secret Access Key, and optional Session Token.
- **Secure Proxy Architecture**: To ensure maximum security, Bedrock API calls are architected to be sent through a backend proxy, which handles the complex and sensitive AWS Signature V4 signing process. This prevents any exposure of secret credentials on the client-side.

### 🚀 Improvements
- **Quad-Provider Model Selector**: The **Model Selector** UI now features a fourth "Bedrock" tab, which is automatically enabled when AWS credentials are provided.
- **Provider-Aware Logic**: The core service layer has been extended to handle Bedrock's unique API request/response formats, including specific payload structures for Claude, Llama, and Titan models.
- **Updated Documentation**: The `README.md` has been updated with detailed instructions on how to configure and use AWS Bedrock within the application.

---

## **Version 4.0.0** — The Productivity & UX Polish

This release focuses on refining the user experience and integrating powerful workflow enhancements. Key updates include a streamlined way to create tasks directly from chat messages and a more intuitive emoji-based icon picker for AI personas. Additionally, core project documentation has been significantly improved for clarity.

### ✨ New Features & 🚀 Improvements
- **One-Click Task Creation**: A new `+` icon on every model response allows you to instantly add the message content to your To-Do list, seamlessly turning conversation into action.
- **Intuitive Persona Icons**: The text input for persona icons has been replaced with a user-friendly, clickable emoji picker, making persona customization faster and more visual.
- **Comprehensive Documentation Rewrite**: The `README.md` and `RELEASENOTES.md` files have been completely overhauled for improved structure, clarity, and user guidance.

---

## **Version 3.0.0** — The Anthropic Integration

This landmark release integrates full support for Anthropic's Claude models, evolving the application into a comprehensive tri-provider AI toolkit. Users can now seamlessly leverage the unique strengths of premier models from Google, OpenAI, and Anthropic within a single, unified interface.

### ✨ New Features
- **Anthropic Model Integration**: Introduced complete support for Anthropic's state-of-the-art model family:
    - **Claude 3.5 Sonnet**: Anthropic's newest and most intelligent model, offering top-tier performance with exceptional speed.
    - **Claude 3 Opus**: The highest-performance model for tackling highly complex, multi-step tasks with maximum accuracy.
    - **Claude 3 Haiku**: The fastest and most compact model for near-instant responsiveness in real-time interactions.
- **Multi-modal Vision for Claude**: Users can now attach images to prompts when using any **Claude 3** model to leverage its powerful vision and analysis capabilities.
- **Expanded API Key Management**: The **API Key Manager** now includes a dedicated section for Anthropic, allowing users to securely save their key in their browser's local storage.

### 🚀 Improvements
- **Intelligent Provider-Aware UI**:
    - The **Model Selector** now features three distinct tabs for Google, OpenAI, and Anthropic, enabling quick and intuitive switching between providers. The Anthropic tab is automatically enabled after a key is configured.
    - The UI dynamically disables provider-specific features (e.g., `/create-video` for Google) when an incompatible model is selected, ensuring a clean and accurate user experience.
- **Generalized AI Service Layer**: The core service logic has been further modularized to flawlessly handle API requests, streaming responses, and error parsing for all three providers.
- **Dynamic Content**: The application's welcome message and initial example prompts now intelligently adapt to reflect the capabilities of the selected Anthropic model.
- **Updated Documentation**: The `README.md` and all relevant user guides have been updated to include instructions for configuring and using the new Anthropic models.

---

## **Version 2.0.0** — The Multi-Provider Update

This major update introduced support for OpenAI models, transforming the application into a versatile dual-provider AI powerhouse. Users gained the ability to switch between Google's and OpenAI's flagship models on the fly.

### ✨ New Features
- **OpenAI Model Integration**: Added full support for OpenAI's most powerful chat models:
    - **GPT-4o**: The latest, most advanced, multi-modal model from OpenAI.
    - **GPT-4 Turbo**: A high-performance model optimized for large-scale tasks.
    - **GPT-3.5 Turbo**: A fast and cost-effective option for standard chat applications.
- **DALL-E 3 Image Generation**: The `/imagine` command was enhanced to use **DALL-E 3** when an OpenAI model is selected, offering a new dimension of creative and illustrative image generation.
- **Unified API Key Manager**: The **API Key Manager** was redesigned to handle both Google and OpenAI keys separately, storing the OpenAI key securely in local storage.
- **Cross-Provider Vision Support**: Image understanding (vision) was enabled for all capable models, including **Gemini** and **GPT-4o**.

### 🚀 Improvements
- **Provider-Aware UI**:
    - The **Model Selector** was updated with a tabbed interface to easily switch between Google and OpenAI models.
    - Google-specific features like **Date Filtering** and **Deep Research Mode** are automatically disabled when an OpenAI model is active to prevent user confusion.
- **Refactored AI Service Layer**: The backend service logic was abstracted to cleanly handle API calls to either Google or OpenAI based on the user's active model selection.
- **Dynamic Initial Prompts**: The initial welcome message and example prompts were updated to dynamically adjust based on the selected model provider's capabilities.
- **Updated Documentation**: The `README.md` was extensively rewritten to reflect the new dual-provider architecture and provide clear setup instructions.

---

## **Version 1.0.0** — Initial Release

The inaugural release of the Conversational Search application, a powerful and feature-rich tool built on the Google Gemini API.

### ✨ Key Features

- **Core AI & Search**:
    - Conversational search with **Google Search Grounding** for cited, up-to-date answers.
    - Support for **Gemini 2.5 Flash** and **Gemini 2.5 Pro**.
    - **Deep Research Mode** with predefined analysis scopes for in-depth inquiries.
    - Advanced search filtering by date ranges.
- **Multi-Modal Interaction**:
    - Image generation via the `/imagine` command, powered by **Imagen**.
    - Video generation via the `/create-video` command, powered by **Veo**.
    - Image understanding and analysis through file attachments.
- **Productivity & Chat Management**:
    - AI-powered conversation summaries using the `/summarize` command.
    - Chat export to TXT, JSON, and Markdown formats.
    - Integrated To-Do List, Recent Queries, and autosaving of message drafts.
- **Customization & User Experience**:
    - A powerful theming engine with a **Custom CSS Editor**.
    - A smart Markdown editor with live preview and voice input (speech-to-text).
    - AI-powered suggestions for follow-up prompts and related topics.
- **Technical Excellence**:
    - Real-time streaming for fluid, natural-feeling responses.
    - Robust, user-friendly error handling and reporting.
    - A secure API key selection flow for billed features.
    - A fully responsive and accessible design.