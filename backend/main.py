
import os
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL_NAME = "gemini-1.5-flash-001" 

# Initialize Vertex AI
if PROJECT_ID:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = GenerativeModel(MODEL_NAME)
else:
    logging.warning("GOOGLE_CLOUD_PROJECT not set. Vertex AI will not work.")
    model = None

app = FastAPI()

class ChatRequest(BaseModel):
    # This structure depends on what the ElevenLabs Agent sends. 
    # Usually it might send the full conversation history.
    # For now, we'll accept a flexible input.
    text: str
    conversation_id: Optional[str] = None
    history: Optional[List[dict]] = [] # List of {"role": "user"|"model", "content": "..."}

class ChatResponse(BaseModel):
    response: str

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Memoria Brain"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Receives input from the ElevenLabs Agent and generates a response using Gemini.
    """
    if not model:
        raise HTTPException(status_code=500, detail="Vertex AI not configured.")

    print(f"Received request: {request}")

    try:
        # Construct the prompt history for Gemini
        # We want to act as an empathetic interviewer.
        
        system_instruction = """
        You are Memoria, an empathetic AI biographer. 
        Your goal is to interview the user to preserve their life stories.
        Ask warm, open-ended questions. 
        Listen carefully to their answers.
        Ask relevant follow-up questions based on what they just said to dig deeper.
        Keep your responses concise and conversational (suitable for voice).
        Do not produce long monologues.
        """
        
        # Simple stateless interaction for now, or use history if provided
        # For better context, we should maintain history. 
        # Here we assume 'history' passed from client or we reconstruct it.
        
        chat = model.start_chat()
        
        # Send message
        response = chat.send_message(f"{system_instruction}\n\nUser: {request.text}")
        
        return ChatResponse(response=response.text)

    except Exception as e:
        logging.error(f"Error calling Vertex AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
