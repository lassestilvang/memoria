
import os
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession, Content, Part

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL_NAME = "gemini-2.5-flash-lite" 

# Initialize Vertex AI
if PROJECT_ID:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = GenerativeModel(MODEL_NAME)
else:
    logging.warning("GOOGLE_CLOUD_PROJECT not set. Vertex AI will not work.")
    model = None

app = FastAPI()

import time
import uuid

class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "gpt-3.5-turbo" # Default, ignored by us as we use Gemini
    messages: List[Message]
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False

from fastapi.responses import StreamingResponse
import json

@app.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """
    Mimics the OpenAI Chat Completions API.
    ElevenLabs will send the conversation history here.
    """
    if not model:
        raise HTTPException(status_code=500, detail="Vertex AI not configured.")

    print(f"Received completion request with {len(request.messages)} messages, stream={request.stream}")

    try:
        # 1. Parse Messages
        # Extract system prompt if present
        system_instruction = "You are Memoria, an empathetic AI biographer."
        history = []
        
        for msg in request.messages:
            if msg.role == "system":
                system_instruction = msg.content
            elif msg.role == "user":
                history.append(Content(role="user", parts=[Part.from_text(msg.content)]))
            elif msg.role == "assistant":
                history.append(Content(role="model", parts=[Part.from_text(msg.content)]))

        # 2. Configure Gemini with the specific system prompt for this turn
        current_model = GenerativeModel(
            MODEL_NAME, 
            system_instruction=[system_instruction]
        )
        
        # 3. Generate Response
        chat = current_model.start_chat(history=history[:-1] if history else [])
        
        # The last message is the user's new input
        last_message = history[-1].parts[0].text if history and history[-1].role == 'user' else "Continue"
        
        if request.stream:
            async def generate_chunks():
                response = chat.send_message(last_message, stream=True)
                chunk_id = f"chatcmpl-{uuid.uuid4()}"
                
                for chunk in response:
                    if chunk.text:
                        data = {
                            "id": chunk_id,
                            "object": "chat.completion.chunk",
                            "created": int(time.time()),
                            "model": "memoria-gemini",
                            "choices": [{
                                "index": 0,
                                "delta": {"content": chunk.text},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                
                # Send terminal chunk
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(generate_chunks(), media_type="text/event-stream")

        else:
            response = chat.send_message(last_message)
            response_text = response.text

            # 4. Format Response as OpenAI API
            return {
                "id": f"chatcmpl-{uuid.uuid4()}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "memoria-gemini",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 0, # Placeholder
                    "completion_tokens": 0,
                    "total_tokens": 0
                }
            }

    except Exception as e:
        logging.error(f"Error calling Vertex AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Use PORT env variable if available (Cloud Run), otherwise default to 8000 (Local)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
