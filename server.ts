import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  generateGeminiSpeech,
  validateApiKey,
  CATEGORIZED_VOICES,
  handleAgentVideoRequest,
  generateDualSpeakerDialogue,
} from './src/server/geminiTts.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// CORS
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasDefaultKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/tts/voices', (_req, res) => {
  res.json({ voices: CATEGORIZED_VOICES });
});

app.post('/api/tts/generate', async (req, res) => {
  try {
    const result = await generateGeminiSpeech(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Speech generation failed' });
  }
});

app.post('/api/tts/dual-speaker', async (req, res) => {
  try {
    const result = await generateDualSpeakerDialogue(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Dual-speaker conversation failed' });
  }
});

app.post('/api/agent/generate-video', async (req, res) => {
  try {
    const result = await handleAgentVideoRequest(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Agent video generation failed' });
  }
});

app.post('/api/tts/validate-key', async (req, res) => {
  try {
    const result = await validateApiKey(req.body.apiKey);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Key validation failed' });
  }
});

// Serve static assets in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VoxGemini Studio server running on port ${PORT}`);
});
