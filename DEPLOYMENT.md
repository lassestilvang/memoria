# Deploying Memoria to Google Cloud

This guide covers deploying the **Backend (FastAPI)** to **Google Cloud Run** and the **Frontend (React/Vite)** to **Firebase Hosting**.

## 🚀 1. Backend Deployment (Cloud Run)

The backend is configured to deploy automatically via **Cloud Build** when you push to GitHub.

### Step 1: Enable Google Cloud APIs
Enable the following APIs in the [GCP Console](https://console.cloud.google.com/):
- **Cloud Run Admin API**
- **Cloud Build API**
- **Artifact Registry API** (or Container Registry)
- **Vertex AI API** (Required for RAG & Image Generation)

### Step 2: Configure Cloud Build Trigger
1.  Go to **Cloud Build** > **Triggers**.
2.  Click **Create Trigger**.
3.  **Name**: `deploy-memoria-backend`.
4.  **Source**: Connect your GitHub repository.
5.  **Branch**: `^main$` (or your default branch).
6.  **Configuration**: Select `Cloud Build configuration file (yaml/json)`.
7.  **Location**: `cloudbuild.yaml` (root directory).

### Step 3: Service Account Permissions
The Cloud Build service account (`[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`) needs:
- **Cloud Run Admin**
- **Service Account User**

### Step 4: Environment Variables (Post-Deployment)
Once the first deployment succeeds:
1.  Go to **Cloud Run** > `memoria-brain`.
2.  Click **Edit & Deploy New Revision**.
3.  Add under **Variables & Secrets**:
    - `GOOGLE_CLOUD_PROJECT`: Your Project ID.
    - `GOOGLE_CLOUD_LOCATION`: `us-central1`.
4.  Click **Deploy**.

---

## 🎨 2. Frontend Deployment (Firebase Hosting)

Firebase Hosting is the recommended way to host the React frontend on GCP infrastructure.

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Initialize Firebase
Run this in the **root directory**:
```bash
firebase init hosting
```
- **Project**: Select your GCP project.
- **Public directory**: `frontend/dist`
- **Configure as single-page app**: Yes
- **Automatic builds with GitHub Actions**: Optional (recommended)

### Step 3: Deploy
```bash
cd frontend
npm install
npm run build
cd ..
firebase deploy --only hosting
```

---

## 🔗 3. Connecting ElevenLabs

1.  Copy the **Cloud Run URL** from the Google Cloud Console.
2.  Go to your **ElevenLabs Agent** settings.
3.  Set the **Custom LLM URL** to: `[YOUR_CLOUD_RUN_URL]/chat`.
4.  Ensure the frontend `.env` (or environment variables in CI/CD) has the correct `VITE_ELEVEN_LABS_AGENT_ID`.

---

## 🛠 Troubleshooting

- **CORS Errors**: Ensure the backend `main.py` is configured to allow your frontend's production URL.
- **Imagen/Vertex AI Errors**: Ensure the Cloud Run service account has the **Vertex AI User** role.
- **Database**: Memoria currently uses SQLite. Note that Cloud Run filesystem is ephemeral. For production persistence, consider using **Google Cloud SQL** or **Firestore**.
