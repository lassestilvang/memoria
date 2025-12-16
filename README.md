# Memoria: The Biographer Agent

Memoria is a voice-first application designed to help elderly users preserve their life stories. It uses an empathetic AI interviewer to ask questions, listen to answers, and ask relevant follow-up questions, effectively acting as a personal biographer.

## How it Works

1.  **Voice Interface (ElevenLabs)**: The user speaks to an AI agent that converses in a warm, human-like voice.
2.  **The Brain (Google Gemini)**: The backend receives the conversation context and dynamically generates relevant, deep follow-up questions to uncover the user's stories.

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
