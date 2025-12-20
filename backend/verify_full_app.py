import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_synthesis():
    print("Testing /synthesize endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/synthesize")
        if response.status_code == 200:
            print("Synthesis successful!")
            print("Narrative Preview:", response.json().get("narrative")[:100] + "...")
            return True
        else:
            print(f"Synthesis failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"Error calling synthesis: {e}")
        return False

def test_export():
    print("Testing /export endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/export?user_name=VerificationTest")
        if response.status_code == 200:
            print("Export successful! PDF received.")
            with open("verification_memoir.pdf", "wb") as f:
                f.write(response.content)
            print("Saved memoir to verification_memoir.pdf")
            return True
        else:
            print(f"Export failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"Error calling export: {e}")
        return False

if __name__ == "__main__":
    # Note: These tests require the backend to be running and have verified fragments in the DB.
    # Since we can't easily start the backend and populate it here without more setup, 
    # this script is for manual run by the user or in a local dev environment.
    print("Verification script ready.")
