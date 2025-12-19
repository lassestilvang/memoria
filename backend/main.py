
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
MODEL_NAME = "gemini-1.5-flash" # Reverting to standard Flash for stability

# Initialize Vertex AI
if PROJECT_ID:
    print(f"DEBUG: Initializing Vertex AI with PROJECT_ID: {PROJECT_ID}")
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    model = GenerativeModel(MODEL_NAME)
else:
    print("DEBUG: GOOGLE_CLOUD_PROJECT not set.")
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

from fastapi.responses import StreamingResponse, FileResponse
import json
import database
import rag_service
import memoir_generator
import asyncio

# Initialize DB on startup
database.init_db()

async def extract_memories(session_id: str, messages: List[Message]):
    """
    Background task to extract memory fragments from conversation.
    """
    if not model or len(messages) < 2:
        return

    # Create a prompt for extraction
    history_text = "\n".join([f"{m.role}: {m.content}" for m in messages])
    prompt = f"""
    Analyze the following conversation history from an AI biographer interview.
    1. Extract key "Memory Fragments" (People, Places, Dates, Significant Events).
    2. Identify the "Predominant Era" discussed (modern, vintage (70s-90s), or sepia (pre-70s)).
    
    Return a JSON object with:
    - "fragments": list of {category, content, context}
    - "era": "modern", "vintage", or "sepia"
    
    Conversation:
    {history_text}
    
    JSON Output:
    """
    
    try:
        extraction_model = GenerativeModel("gemini-1.5-flash") # Use standard flash for extraction
        response = extraction_model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        
        fragments = data.get("fragments", [])
        era = data.get("era", "modern")
        
        rag = rag_service.get_rag_service()
        for frag in fragments:
            # ... (same as before)
            content = frag.get("content", "")
            category = frag.get("category", "General")
            context = frag.get("context", "")
            
            embedding = None
            if rag:
                embeddings = rag.get_embeddings([f"{category}: {content}"])
                if embeddings:
                    embedding = rag.serialize_embedding(embeddings[0])
            
            database.save_fragment(session_id, category, content, context, embedding)
        
        # Save era to summary/session metadata if needed, but for now we'll just log
        logging.info(f"Detected Era: {era} for session {session_id}")
        # In a real app, we'd have a way to push this to the frontend (WebSockets)
    except Exception as e:
        logging.error(f"Failed to extract memories: {e}")

@app.post("/chat/completions")
async def chat_completions(request: Request, completion_request: ChatCompletionRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Vertex AI not configured.")
    
    try:
        # 1. Fetch Relevant Memories for Context (RAG)
        user_query = completion_request.messages[-1].content if completion_request.messages else ""
        rag = rag_service.get_rag_service()
        existing_fragments = database.get_all_fragments()
        
        # 1b. Fetch Family Seeds
        active_seeds = database.get_active_seeds()
        seeds_context = ""
        if active_seeds:
            seeds_context = "\n\nFamily members suggested these topics to cover:\n"
            for sid, content in active_seeds:
                seeds_context += f"- {content}\n"
        
        memory_context = ""
        # ... (rest of search logic)
        if existing_fragments and rag and user_query:
            # We search among verified fragments for better context stability
            verified_only = [f for f in existing_fragments if len(f) > 4 and f[4] == 1] # Check is_verified if present
            relevant = rag.retrieve_relevant(user_query, existing_fragments, top_k=5)
            if relevant:
                memory_context = "\n\nRelevant memories from past conversations:\n"
                for cat, content, ctx in relevant:
                    memory_context += f"- [{cat}]: {content} ({ctx})\n"
        elif existing_fragments:
            # Fallback if RAG fails or query is empty - take most recent or generic
            memory_context = "\n\nKnown memories about the user:\n"
            for cat, content, ctx, *rest in existing_fragments[:5]: # Just take first 5
                memory_context += f"- [{cat}]: {content} ({ctx})\n"

        # 1c. Sentiment Analysis (for Phase 5)
        sentiment_instruction = ""
        if user_query:
            try:
                # Lightweight sentiment check
                sentiment_model = GenerativeModel("gemini-1.5-flash")
                sent_resp = sentiment_model.generate_content(f"Analyze the sentiment of this text: '{user_query}'. Return only one word: 'positive', 'neutral', or 'sad/emotional'.")
                sentiment = sent_resp.text.strip().lower()
                if 'sad' in sentiment or 'emotional' in sentiment:
                    sentiment_instruction = "\n\nCRITICAL: The user seems emotional. Use an extremely gentle, slow, and comforting tone. Acknowledge their feelings warmly before continuing."
            except:
                pass

        # 2. Parse Messages & Setup Instructions
        base_system = "You are Memoria, a deeply empathetic and patient AI biographer. Your goal is to help elderly users record their life stories. Keep questions open-ended and use the context of past stories to show you remember them."
        system_instruction = base_system + memory_context + seeds_context + sentiment_instruction
        
        history = []
        for msg in completion_request.messages:
            if msg.role == "system":
                # We append our memory context to whatever system prompt ElevenLabs sends
                system_instruction = msg.content + memory_context
            elif msg.role == "user":
                history.append(Content(role="user", parts=[Part.from_text(msg.content)]))
            elif msg.role == "assistant":
                history.append(Content(role="model", parts=[Part.from_text(msg.content)]))

        # 3. Configure Gemini
        current_model = GenerativeModel(MODEL_NAME, system_instruction=[system_instruction])
        chat = current_model.start_chat(history=history[:-1] if history else [])
        last_message = history[-1].parts[0].text if history and history[-1].role == 'user' else "Hello, I am ready to share my story."

        # 4. Generate & Stream/Return
        session_id = str(uuid.uuid4()) # For now, a new ID per request if not tracked
        
        if completion_request.stream:
            async def generate_chunks():
                response = chat.send_message(last_message, stream=True)
                full_content = ""
                chunk_id = f"chatcmpl-{uuid.uuid4()}"
                
                for chunk in response:
                    if chunk.text:
                        full_content += chunk.text
                        yield f"data: {json.dumps({'id': chunk_id, 'object': 'chat.completion.chunk', 'choices': [{'index': 0, 'delta': {'content': chunk.text}, 'finish_reason': None}]})}\n\n"
                
                # After stream completes, trigger extraction
                asyncio.create_task(extract_memories(session_id, completion_request.messages + [Message(role="assistant", content=full_content)]))
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(generate_chunks(), media_type="text/event-stream")

        else:
            response = chat.send_message(last_message)
            response_text = response.text
            
            # Trigger background extraction
            asyncio.create_task(extract_memories(session_id, completion_request.messages + [Message(role="assistant", content=response_text)]))

            return {
                "id": f"chatcmpl-{uuid.uuid4()}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "memoria-gemini",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop"
                }]
            }

    except Exception as e:
        logging.error(f"Error calling Vertex AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vision-context")
async def vision_context(request: Request):
    """
    Analyzes an uploaded image and adds it to the conversation context.
    """
    if not model:
        raise HTTPException(status_code=500, detail="Vertex AI not configured.")
    
    data = await request.json()
    image_base64 = data.get("image") # base64 string
    session_id = data.get("session_id", "manual-upload")
    
    if not image_base64:
        raise HTTPException(status_code=400, detail="No image provided.")

    import base64
    image_data = base64.b64decode(image_base64)
    
    # Analyze with Gemini Vision
    vision_prompt = "You are an AI biographer assistant. Analyze this photo and describe what you see in a way that helps an interviewer ask meaningful questions. Focus on people, fashion (to guess the era), and activities."
    
    try:
        vision_model = GenerativeModel("gemini-1.5-flash") # Vision capable
        img_part = Part.from_data(data=image_data, mime_type="image/jpeg")
        response = vision_model.generate_content([vision_prompt, img_part])
        
        description = response.text
        # Save as a special 'Visual' fragment
        database.save_fragment(session_id, "Visual Memory", description, "User uploaded a photo")
        
        return {"description": description}
    except Exception as e:
        logging.error(f"Vision analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memories")
async def get_memories(verified: bool = True):
    """
    Returns extracted memory fragments.
    """
    fragments = database.get_all_fragments(verified_only=verified)
    # Simple heuristic for era if not persisted: check for dates or keywords
    era = "modern"
    for frag in fragments:
        content = frag[1].lower()
        if any(w in content for w in ["young", "childhood", "grandparents", "1940", "1950", "1960"]):
            era = "sepia"
            break
        elif any(w in content for w in ["1970", "1980", "1990", "college"]):
            era = "vintage"
            
    return {
        "fragments": [{"id": f[4] if len(f)>4 else None, "category": f[0], "content": f[1], "context": f[2]} for f in fragments],
        "era": era
    }

@app.get("/fragments/pending")
async def get_pending():
    fragments = database.get_pending_fragments()
    return [{"id": f[0], "category": f[1], "content": f[2], "context": f[3]} for f in fragments]

@app.post("/fragments/{fragment_id}/verify")
async def verify_frag(fragment_id: int):
    database.verify_fragment(fragment_id)
    return {"status": "Verified"}

@app.patch("/fragments/{fragment_id}")
async def patch_fragment(fragment_id: int, request: Request):
    data = await request.json()
    content = data.get("content")
    category = data.get("category")
    if not content:
        raise HTTPException(status_code=400, detail="Content required")
    database.update_fragment(fragment_id, content, category)
    return {"status": "Updated"}

@app.delete("/fragments/{fragment_id}")
async def delete_frag(fragment_id: int):
    database.delete_fragment(fragment_id)
    return {"status": "Deleted"}

@app.get("/export")
async def export_memoir(user_name: str = "User"):
    """
    Generates and returns a PDF memoir from verified fragments.
    """
    fragments = database.get_all_fragments(verified_only=True)
    if not fragments:
        raise HTTPException(status_code=400, detail="No memories to export.")
    
    gen = memoir_generator.MemoirGenerator()
    try:
        filepath = gen.generate(user_name, fragments)
        return FileResponse(
            filepath, 
            media_type='application/pdf', 
            filename=os.path.basename(filepath)
        )
    except Exception as e:
        logging.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF.")

@app.post("/seeds")
async def add_seed(request: Request):
    """
    Adds a new memory seed from family.
    """
    data = await request.json()
    content = data.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Seed content required.")
    
    database.save_seed(content)
    return {"status": "Seed saved"}

if __name__ == "__main__":
    import uvicorn
    # Use PORT env variable if available (Cloud Run), otherwise default to 8000 (Local)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
