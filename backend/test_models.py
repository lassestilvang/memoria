#!/usr/bin/env python3
import vertexai
from vertexai.generative_models import GenerativeModel

PROJECT_ID = "memoria-481416"
LOCATION = "us-central1"

# Test different model names
models_to_try = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-2.0-flash-exp",
   "gemini-pro",
]

vertexai.init(project=PROJECT_ID, location=LOCATION)

for model_name in models_to_try:
    try:
        model = GenerativeModel(model_name)
        response = model.generate_content("Say 'OK' if you can hear me")
        print(f"✅ {model_name}: {response.text[:50]}")
    except Exception as e:
        print(f"❌ {model_name}: {str(e)[:100]}")
