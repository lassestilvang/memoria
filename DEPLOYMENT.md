# Deploying Memoria to Google Cloud with GitHub Integration

This guide focuses on deploying the **Backend (The Brain)** to **Google Cloud Run** using **Cloud Build** for continuous deployment when you push to GitHub.

## Prerequisites

1.  A Google Cloud Project.
2.  Billing enabled.
3.  A GitHub repository with this code pushed to it.

## Quick Setup (Cloud Build Trigger)

This is the easiest way to connect GitHub to Google Cloud.

### 1. Enable APIs
Go to the [Google Cloud Console](https://console.cloud.google.com/) and enable these APIs:
-   **Cloud Run Admin API**
-   **Cloud Build API**
-   **Artifact Registry API** (or Container Registry)

### 2. Connect Repository
1.  Go to the **Cloud Build** page in the Google Cloud Console.
2.  Select **Triggers** from the left menu.
3.  Click **Create Trigger**.
4.  **Name**: `deploy-memoria-backend`
5.  **Event**: Push to a branch.
6.  **Source**: Select your **GitHub repository** (you will need to authenticate GitHub app).
7.  **Branch**: `^main$` (or master).
8.  **Configuration**: Select **Cloud Build configuration file (yaml/json)**.
9.  **Location**: `cloudbuild.yaml` (I have created this file in your project root).

### 3. Configure Service Account Permissions
The Cloud Build service account needs permission to deploy to Cloud Run.
1.  Go to **IAM & Admin** > **IAM**.
2.  Find the service account ending in `@cloudbuild.gserviceaccount.com`.
3.  Edit it and add the role: **Cloud Run Admin** and **Service Account User**.

### 4. Push & Deploy
Now, commit and push your code to GitHub:

```bash
git add .
git commit -m "Setup deployment"
git push origin main
```

Cloud Build will automatically:
1.  Detect the push.
2.  Build the Docker image using `backend/Dockerfile`.
3.  Deploy it to Cloud Run service named `memoria-brain`.

## Post-Deployment Configuration

1.  **Get the URL**:
    Go to **Cloud Run** in the console. You will see the `memoria-brain` service. Copy the URL (e.g., `https://memoria-brain-xyz123-uc.a.run.app`).

2.  **Environment Variables**:
    In the Cloud Run Console:
    -   Click on `memoria-brain`.
    -   Click **Edit & Deploy New Revision**.
    -   Go to the **Variables & Secrets** tab.
    -   Add environment variables:
        -   `GOOGLE_CLOUD_PROJECT`: Your Project ID.
        -   `GOOGLE_CLOUD_LOCATION`: `us-central1`.
    -   Click **Deploy**.

3.  **Update ElevenLabs**:
    -   Go to your ElevenLabs Agent settings.
    -   Update the **Custom LLM** URL to your new Cloud Run URL + `/chat`.
    -   Example: `https://memoria-brain-xyz123-uc.a.run.app/chat`
