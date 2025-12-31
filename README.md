# Memoria: The Biographer Agent

Memoria is a voice-first application designed to help elderly users preserve their life stories. It uses an empathetic AI interviewer to ask questions, listen to answers, and ask relevant follow-up questions, effectively acting as a personal biographer.

## How it Works

1.  **Voice Interface (ElevenLabs)**: The user speaks to an AI agent that converses in a warm, human-like voice.
2.  **The Brain (Google Gemini)**: The backend receives the conversation context and dynamically generates relevant, deep follow-up questions to uncover the user's stories.

## About the Project

### 🌟 Inspiration
Memoria was born from a desire to bridge the gap between generations. As our elders age, their stories—the tapestry of our shared history—often fade away. We wanted to create a tool that isn't just a database, but an empathetic companion that listens, remembers, and helps transform fleeting memories into a lasting legacy. The goal was to make technology "invisible" so that the focus remains entirely on the human story.

### 🧠 What I Learned
Building Memoria was an intensive journey into the cutting edge of AI:
- **Conversational AI Engineering**: Learning to manage state and context in real-time voice interactions using the ElevenLabs SDK.
- **Advanced RAG (Retrieval-Augmented Generation)**: Implementing a "Infinite Memory Engine" to ensure the AI maintains continuity across multiple interview sessions.
- **Senior-Centric UX**: Understanding that for the elderly, "high-tech" must feel "low-effort." This meant prioritizing high-contrast dark modes, large interactive areas, and minimal menu structures.
- **Multimodal Orchestration**: Coordinating visual analysis (Vertex AI Vision) with verbal story extraction.

### 🛠️ How I Built It
The project is built on a modern, high-performance stack:
- **Frontend**: Developed with **React 19** and **Vite** for a snappy experience, styled with **Tailwind CSS 4** for a premium, custom aesthetic.
- **Backend**: A **Python FastAPI** server that acts as a custom LLM bridge, orchestrating the intelligence of the system.
- **AI Core**: Powered by **Google Vertex AI**, utilizing **Gemini 1.5 Flash** for deep reasoning, **text-embedding-004** for the memory search, and **Imagen 3** for generating cinematic illustrations for the memoir.
- **Voice**: Integrated **ElevenLabs** for industry-leading text-to-speech and speech-to-text with extremely low latency.
- **Persistence**: **SQLite** serves as our vector and fragment store, keeping everything lightweight yet powerful.

### 🚧 Challenges Faced
- **Latency vs. Intelligence**: One of the biggest hurdles was performing RAG lookups and complex LLM reasoning fast enough to keep the voice conversation feeling natural. We solved this with background tasks and optimized prompt chaining.
- **Contextual Continuity**: Ensuring the AI remembers that "Aunt Martha" mentioned in the first session is the same person mentioned in the fifth required a robust entity extraction and linking system.
- **Senior Accessibility**: Designing a dark mode that was "premium" yet highly readable for users with visual impairments involved many iterations on typography and color contrast.
- **Multimodal Integration**: Syncing uploaded photos with specific timestamps in a conversation to create the "Audible Storybook" feature was a complex state management challenge.

## Project Structure

-   `frontend/`: React + Vite application using the ElevenLabs React SDK.
-   `backend/`: Python FastAPI application acting as the "Custom LLM" for the ElevenLabs Agent, integrated with Google Vertex AI.

## Prerequisites

-   Node.js & npm
-   Python 3.8+
-   ElevenLabs Account
-   Google Cloud Platform Account (with Vertex AI API enabled)

## Setup & Configuration

### 1. Backend Setup

The backend serves as the logic layer connecting the ElevenLabs Agent to Google Gemini.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt # Note: Ensure you have installed dependencies manually if requirements.txt is missing (fastapi uvicorn google-cloud-aiplatform python-dotenv)
```

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

### 2. Frontend Setup

The frontend provides the visual interface for the voice interaction.

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_ELEVENLABS_AGENT_ID=your-elevenlabs-agent-id
```

### 3. ElevenLabs Agent Configuration

1.  Create a new conversational agent in ElevenLabs.
2.  Configure the **LLM** setting to use a **Custom LLM** (server).
3.  Point the server URL to your deployed backend (or a local tunnel like ngrok).
    -   Endpoint: `POST /chat`
4.  Copy the **Agent ID** to your frontend `.env`.

## Running the Application

1.  **Start the Backend**:
    ```bash
    # In /backend
    source venv/bin/activate
    python main.py
    ```
    The server runs on `http://0.0.0.0:8000`.

2.  **Start the Frontend**:
    ```bash
    # In /frontend
    npm run dev
    ```
    Open your browser to the URL shown (usually `http://localhost:5173`).

3.  **Start Interview**: Click "Start Session" and begin talking!

## Deployment

For instructions on how to deploy the backend to Google Cloud Run with GitHub integration, please see [DEPLOYMENT.md](./DEPLOYMENT.md).
