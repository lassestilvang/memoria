import asyncio
import json
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test_rag():
    url = "http://localhost:8000/chat/completions"
    
    # First, let's trigger an extraction by sending a message
    payload = {
        "messages": [
            {"role": "system", "content": "You are a biographer."},
            {"role": "user", "content": "My name is Lasse and I grew up in a small town in Denmark called Odense. I loved playing football as a kid."}
        ]
    }
    
    print("--- Sending message to seed memories ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()['choices'][0]['message']['content']}")
        
    print("\nWaiting for background extraction...")
    await asyncio.sleep(5) # Wait for extraction to complete
    
    # Now, let's ask something related and see if RAG picks it up
    payload_rag = {
        "messages": [
            {"role": "system", "content": "You are a biographer."},
            {"role": "user", "content": "What do you know about my childhood in Denmark?"}
        ]
    }
    
    print("\n--- Sending follow-up to test RAG retrieval ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload_rag)
        print(f"Status: {response.status_code}")
        # Note: We can't easily see the internal prompt, but we can check if the response acknowledges the context
        print(f"Response: {response.json()['choices'][0]['message']['content']}")

    # Also check /memories endpoint
    print("\n--- Checking /memories endpoint ---")
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/memories")
        print(f"Memories: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    asyncio.run(test_rag())
