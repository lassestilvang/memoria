import vertexai
from vertexai.generative_models import GenerativeModel
import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = "memoria-481416"
LOCATION = "us-central1"

print(f"Testing Vertex AI with Project: {PROJECT_ID}")
vertexai.init(project=PROJECT_ID, location=LOCATION)

try:
    model = GenerativeModel("gemini-1.5-flash-001")
    response = model.generate_content("Hello, write a 1-sentence test response.")
    print("SUCCESS!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"FAILURE: {e}")
