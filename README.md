# Fullstack ChatGPT + Whisper App

A fullstack application featuring a React frontend and a Node.js (Express) backend, integrating OpenAI's ChatGPT and Whisper APIs. Includes text chat, voice-to-text, and robust error handling.

---

## Features
- **ChatGPT-like interface**: Modern, responsive chat UI
- **Voice input**: Record and transcribe audio using OpenAI Whisper
- **Robust error handling**: Handles API/network errors gracefully
- **Port conflict resolution**: Backend auto-switches ports if needed
- **Loading indicators**: Shows feedback while waiting for API responses

---

## Prerequisites
- Node.js (v18+ recommended)
- npm
- OpenAI API key ([get one here](https://platform.openai.com/account/api-keys))

---

## Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd fullstack-app
```

### 2. Install dependencies
#### Backend
```bash
cd backend
npm install
```
#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Configure environment variables
Create a `.env` file in the `backend` directory:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

---

## Running the App

### Start the backend
```bash
cd backend
npm run dev
```
- The backend will try port 3000, then 30001, etc. if the port is in use.

### Start the frontend
```bash
cd frontend
npm run dev
```
- The frontend will be available at [http://localhost:5173](http://localhost:5173) (or the next available port).

---

## Usage
- **Text chat**: Type your question and press Enter or click the send button.
- **Voice input**: Click the microphone button, speak, then click again to stop and transcribe.
- **Error handling**: If the OpenAI API returns an error (rate limit, invalid key, etc.), a user-friendly message will be shown.
- **Loading**: A loading indicator appears while waiting for responses.

---

## Troubleshooting
- **Port in use**: The backend will automatically try the next port if 3000 is busy.
- **OpenAI errors**: Check your API key and usage limits. Errors are shown in the chat and logged in the backend console.
- **Audio format errors**: Only supported formats (webm, wav, mp3, etc.) are accepted for Whisper.
- **Frontend build errors**: If you see PostCSS or Tailwind errors, ensure you have the correct config files and use `.cjs` for PostCSS if using ES modules.

---

## Customization
- **System prompt**: Change the system prompt in `backend/server.js` for a different assistant persona.
- **Styling**: Edit `frontend/src/styles/app.scss` for UI tweaks.

---

## License
MIT 