# 🌌 RagBot AI 2.0: Cosmic RAG Platform

An enterprise-grade Retrieval-Augmented Generation (RAG) platform with a modern Cosmic Glassmorphism UI.

<div align="left">
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Pinecone-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/Groq_LLaMA_3-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" />
</div>

## ✨ Visual Experience

![Landing Page](assets/landing.png)
![Authenticated Chat](assets/chat.png)
![Document Library](assets/library.png)

*(Note: Please ensure your screenshots are saved in the `assets/` folder with the names `landing.png`, `chat.png`, and `library.png`)*

## 🚀 Feature Highlights

- 🌙 **Seamless Theme Engine**: Fluid transition between "Cosmic Obsidian" (Dark) and "Ethereal Dawn" (Light) modes.
- 🔐 **Secure Authentication**: Firebase-powered Google and Email login with a glassmorphic Auth Gate.
- 🛡️ **Multi-Tenant Privacy**: Advanced document isolation using Pinecone Namespacing—User A can never access User B's documents.
- 🧠 **Context-Aware Memory**: Persistent chat sessions stored in Firestore with full conversation history sent to the LLM.
- ⚡ **Lightning-Fast Streaming**: Real-time LLaMA 3 responses via Groq with a typewriter UI effect.

## 🛠️ Installation & Local Setup

### Step 1: Clone & Setup

```bash
git clone https://github.com/your-username/RagBot-2.0.git
cd RagBot-2.0
```

### Step 2: Backend (FastAPI)

1. Navigate to `/server`.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure the `.env` file in the `/server` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=your_pinecone_index_name
   ```
6. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Step 3: Frontend (Next.js)

1. Navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `frontend/.env.local` with Firebase credentials and the backend API URL:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🚢 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Configure the Root Directory to `frontend`.
4. Ensure the Framework Preset is set to **Next.js**.
5. Add all the environment variables from your `.env.local` file to the Vercel dashboard.
6. Deploy!

### Backend Deployment (Render / Railway)
1. In your hosting platform, create a new Web Service from your repository.
2. Set the Root Directory to `server`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   *(Or rely on a `Procfile` if applicable: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`)*
5. Add your backend `.env` variables to the dashboard.
6. Deploy!

### Security

Make sure to protect your user's chat history with proper Firebase Firestore Security Rules. Navigate to the Firestore Database settings in the Firebase Console and deploy the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId);
    }
    match /{document=**} {
      allow read, write: if false; // Deny all other access by default
    }
  }
}
```

## 📁 Repository Structure

```text
RagBot-2.0/
├── frontend/   # Next.js 15 Client
├── server/     # FastAPI Backend & RAG Modules
├── assets/     # Branding & Screenshots
└── README.md
```
