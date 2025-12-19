# GEMINI.md - Memoria Project Context

## Project Overview
**Memoria** is a voice-first AI application designed to help elderly users preserve their life stories. It features an empathetic AI interviewer that asks questions, listens to stories, and provides human-like follow-up questions.

### Architecture
- **Frontend**: A React application that provides the voice interface using the ElevenLabs React SDK.
- **Backend (The Brain)**: A Python FastAPI application that acts as a custom LLM for the ElevenLabs agent. It integrates with Google Vertex AI to use the Gemini model for conversation generation.
- **Voice Agent**: Powered by ElevenLabs Conversational AI, which handles Speech-to-Text (STT) and Text-to-Speech (TTS).

### Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, TypeScript, `@elevenlabs/react`.
- **Backend**: Python 3.9+, FastAPI, `google-cloud-aiplatform` (Vertex AI), `pydantic`.
- **LLM**: Google Gemini 2.5 Flash Lite (via Vertex AI).
- **Deployment**: Google Cloud Run, Google Cloud Build (CI/CD).

---

## Building and Running

### Backend
1. **Navigate to backend**: `cd backend`
2. **Setup virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Configure environment**: Create a `.env` file with:
   ```env
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```
4. **Run locally**:
   ```bash
   python main.py
   ```
   *The backend runs on `http://localhost:8000`.*

### Frontend
1. **Navigate to frontend**: `cd frontend`
2. **Install dependencies**: `npm install`
3. **Configure environment**: Create a `.env` file with:
   ```env
   VITE_ELEVENLABS_AGENT_ID=your-agent-id
   ```
4. **Run development server**: `npm run dev`
   *The frontend runs on `http://localhost:5173`.*

---

## Development Conventions

### Backend
- **FastAPI**: Uses Pydantic models for request/response validation.
- **Vertex AI**: Initialized via `vertexai.init()`. Uses `GenerativeModel` with system instructions.
- **OpenAI Compatibility**: The `/chat/completions` endpoint mimics the OpenAI API format to integrate seamlessly with ElevenLabs.
- **Logging**: Uses standard Python logging.

### Frontend
- **Functional Components**: React 19 functional components with TypeScript.
- **Styling**: Tailwind CSS 4 utility classes.
- **Environment Variables**: Managed via Vite (`import.meta.env`).
- **ElevenLabs Integration**: Uses the `useConversation` hook from `@elevenlabs/react`.

---

## Deployment & Infrastructure
- **CI/CD**: Managed by `cloudbuild.yaml`. Pushes to GitHub trigger builds that deploy to Google Cloud Run.
- **Containerization**: The backend is dockerized using the `backend/Dockerfile`.
- **Cloud Run**: The service is named `memoria-brain` and must be public (`--allow-unauthenticated`) for ElevenLabs to access it.

---

## Key Files
- `backend/main.py`: Core logic for Gemini integration and OpenAI-compatible endpoint.
- `frontend/src/components/Interviewer.tsx`: Main voice interface component.
- `cloudbuild.yaml`: Google Cloud Build pipeline configuration.
- `DEPLOYMENT.md`: Detailed deployment guide.
