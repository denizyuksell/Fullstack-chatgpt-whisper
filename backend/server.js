const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname) || '.wav';
    cb(null, `${Date.now()}${fileExt}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 
      'audio/ogg', 'audio/flac', 'audio/m4a', 'audio/webm'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Supported types: ${allowedMimes.join(', ')}`));
    }
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ChatGPT + Whisper API' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are Deniz, a helpful assistant.' },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
      });
    } catch (apiError) {
      const status = apiError.status || 500;
      const errorMsg = apiError.error?.message || apiError.message || 'OpenAI API error';
      if (status === 429) {
        return res.status(429).json({ error: 'You are being rate limited by OpenAI. Please try again later.' });
      }
      return res.status(status).json({ error: errorMsg });
    }

    if (
      !completion ||
      !completion.choices ||
      !completion.choices[0] ||
      !completion.choices[0].message ||
      !completion.choices[0].message.content
    ) {
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    res.json({ message: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI Chat Error:', error);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !fs.existsSync(req.file.path)) {
      return res.status(400).json({ error: 'No audio file provided or file missing' });
    }

    console.log('Received file:', req.file);
    console.log('File path:', req.file.path);
    console.log('File mime type:', req.file.mimetype);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      response_format: 'json',
    });

    fs.unlinkSync(req.file.path);
    
    if (!transcription.text || transcription.text.trim() === '') {
      return res.json({ text: 'No speech detected in the audio.' });
    }
    
    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Whisper Error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    const errorMessage = error.error?.message || error.message || 'Transcription failed';
    res.status(500).json({ 
      error: errorMessage,
      details: error.error || error.message
    });
  }
});

function startServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`Server running on port ${portToUse}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToUse} is in use. Trying ${portToUse + 1}...`);
      startServer(portToUse + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(port);
