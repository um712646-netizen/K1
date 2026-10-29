import { GoogleGenAI } from '@google/genai';

export interface GenerateSpeechOptions {
  text: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  style?: string;
  model?: 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts';
  customApiKey?: string;
}

export interface VoiceInfo {
  id: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  name: string;
  category: 'Storyteller' | 'Commercial' | 'Calm' | 'Anime' | 'Custom';
  gender: 'Female' | 'Male' | 'Neutral';
  description: string;
  tone: string;
  characterArchetype: string;
  recommendedStyles: string[];
  sampleQuote: string;
  customProfileId?: string;
}

export interface DualSpeakerRequest {
  speaker1: {
    name: string;
    voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
    style?: string;
  };
  speaker2: {
    name: string;
    voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
    style?: string;
  };
  lines: Array<{
    speaker: string;
    text: string;
  }>;
  customApiKey?: string;
}

export const CATEGORIZED_VOICES: VoiceInfo[] = [
  // Storyteller Category
  {
    id: 'Charon',
    name: 'Charon',
    category: 'Storyteller',
    gender: 'Male',
    description: 'Deep, resonant, authoritative, and cinematic. Reverberates with gravitas and measured cadence.',
    tone: 'Epic & Authoritative',
    characterArchetype: 'Ancient Narrator & Documentary Master',
    recommendedStyles: [
      'Deep cinematic trailer narrator',
      'Authoritative historical documentary',
      'Mysterious noir detective',
    ],
    sampleQuote: 'Across the forgotten horizons, silence was the first law of the ancient world.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    category: 'Storyteller',
    gender: 'Male',
    description: 'Grounded, gritty, dramatic, and intense. Ideal for fantasy sagas, solemn chronicles, and audio dramas.',
    tone: 'Grounded & Intense',
    characterArchetype: 'Grim Warrior & Fantasy Chronicleer',
    recommendedStyles: [
      'Grounded fantasy chronicler',
      'Intense dramatic scene',
      'Solemn oath recitation',
    ],
    sampleQuote: 'The storm gathered on the iron ridge, <breath> waiting for a warrior brave enough to cross.',
  },

  // Commercial & Tech Category
  {
    id: 'Puck',
    name: 'Puck',
    category: 'Commercial',
    gender: 'Male',
    description: 'Dynamic, upbeat, punchy, and personable. Perfect for tech launches, advertisements, and fast tutorials.',
    tone: 'Enthusiastic & High-Energy',
    characterArchetype: 'Tech Host & Modern Creator',
    recommendedStyles: [
      'Enthusiastic tech reviewer',
      'Upbeat commercial voiceover',
      'Fast-paced podcast banter',
    ],
    sampleQuote: 'Wait, <laugh> you mean to tell me this entire voice generation API is completely free?',
  },
  {
    id: 'Kore',
    name: 'Kore',
    category: 'Commercial',
    gender: 'Female',
    description: 'Crisp, modern, balanced, and confident. The gold standard for product tours, explainers, and corporate messaging.',
    tone: 'Crisp & Articulate',
    characterArchetype: 'SaaS Presenter & Executive Guide',
    recommendedStyles: [
      'Clear, professional explainer',
      'Confident product demo',
      'Engaging modern instructor',
    ],
    sampleQuote: 'VoxGemini Studio enables developers to deploy neural voice agents in under ten minutes.',
  },

  // Calm & Wellness Category
  {
    id: 'Zephyr',
    name: 'Zephyr',
    category: 'Calm',
    gender: 'Female',
    description: 'Gentle, whispering, melodic, and serene. Designed for sleep stories, breathwork, and ambient audio.',
    tone: 'Soothing & Serene',
    characterArchetype: 'Mindfulness Mentor & Sleep Companion',
    recommendedStyles: [
      'Soft and gentle mindfulness guide',
      'Quiet bedtime storytelling',
      'Ambient peaceful voiceover',
    ],
    sampleQuote: 'Gently breathe in, <sigh> and allow all the noise of the day to drift quietly away.',
  },

  // Anime & Character Category
  {
    id: 'Puck',
    name: 'Puck (Anime Hero)',
    category: 'Anime',
    gender: 'Male',
    description: 'High-energy, spirited, and determined. Perfect for shonen anime protagonists, youthful heroes, and comedic sidekicks.',
    tone: 'Spirited & Passionate',
    characterArchetype: 'Shonen Anime Protagonist',
    recommendedStyles: [
      'Passionate anime battle cry',
      'Excited comedic adventurer',
      'Determined young hero',
    ],
    sampleQuote: 'You really thought I was finished? <gasp> |yeah| Watch this power!',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (Dark Villain)',
    category: 'Anime',
    gender: 'Male',
    description: 'Menacing, gravelly, commanding, and sinister. Built for dark fantasy bosses, anti-heroes, and anime antagonists.',
    tone: 'Sinister & Formidable',
    characterArchetype: 'Anime Overlord & Anti-Hero',
    recommendedStyles: [
      'Menacing anime antagonist',
      'Gravelly dark anti-hero',
      'Cold calculated mastermind',
    ],
    sampleQuote: 'Foolish mortal. <laugh> You dare challenge the shadows of destiny?',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Ethereal Spirit)',
    category: 'Anime',
    gender: 'Female',
    description: 'Mystical, soft, melodic, and otherworldly. Ideal for magical mentors, shrine maidens, and ethereal fantasy beings.',
    tone: 'Ethereal & Magical',
    characterArchetype: 'Magical Spirit & Anime Oracle',
    recommendedStyles: [
      'Mystical shrine maiden',
      'Soft enchanted fairy',
      'Ancient anime oracle',
    ],
    sampleQuote: 'Listen closely to the wind... <whisper> it carries the secret of the celestial realm.</whisper>',
  },
];

export function detectExpressiveTags(text: string): boolean {
  return /<laugh>|<gasp>|<breath>|<sigh>|<cough>|<whisper>|\|mhm\||\|yeah\||\|aha\||\[whispering\]|\[excited\]|\[dramatic\]/i.test(
    text
  );
}

export async function generateGeminiSpeech(options: GenerateSpeechOptions) {
  const { text, voiceName = 'Kore', style, customApiKey, model } = options;

  if (!text || text.trim().length === 0) {
    throw new Error('Text input cannot be empty');
  }

  const effectiveKey =
    customApiKey && customApiKey.trim().length > 0
      ? customApiKey.trim()
      : process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    throw new Error(
      'No Gemini API key configured on server. Please provide a key or check server environment.'
    );
  }

  const hasExpressiveTags = detectExpressiveTags(text);
  const selectedModel =
    model || (hasExpressiveTags ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts');

  const ai = new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const startTime = Date.now();

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: text.trim(),
            ...(style && style.trim().length > 0
              ? {
                  speechMetadata: {
                    style: style.trim(),
                  },
                }
              : {}),
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  });

  const durationMs = Date.now() - startTime;
  const candidate = response.candidates?.[0];
  const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('Model did not return speech audio. Please try with different text.');
  }

  const base64Audio = audioPart.inlineData.data;
  const mimeType = audioPart.inlineData.mimeType || 'audio/wav';
  const byteLength = Math.round((base64Audio.length * 3) / 4);

  return {
    success: true,
    audioBase64: base64Audio,
    mimeType,
    byteLength,
    latencyMs: durationMs,
    voiceName,
    style: style || 'Default',
    model: selectedModel,
    hasExpressiveTags,
  };
}

export async function generateDualSpeakerDialogue(options: DualSpeakerRequest) {
  const { speaker1, speaker2, lines, customApiKey } = options;

  if (!lines || lines.length === 0) {
    throw new Error('Dialogue lines cannot be empty');
  }

  const effectiveKey =
    customApiKey && customApiKey.trim().length > 0
      ? customApiKey.trim()
      : process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    throw new Error(
      'No Gemini API key configured on server. Please provide a key or check server environment.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const startTime = Date.now();

  // Construct parts according to official multi-speaker screenplay guidelines
  const parts = lines.map((l) => ({
    text: `${l.speaker}: ${l.text.trim()}`,
    speechMetadata: {
      speaker: l.speaker,
      style:
        l.speaker === speaker1.name
          ? speaker1.style || 'Natural conversational style'
          : speaker2.style || 'Natural conversational style',
    },
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-tts',
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: speaker1.name,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speaker1.voiceName },
              },
            },
            {
              speaker: speaker2.name,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speaker2.voiceName },
              },
            },
          ],
        },
      },
    },
  });

  const durationMs = Date.now() - startTime;
  const candidate = response.candidates?.[0];
  const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('Model did not return dual-speaker audio');
  }

  const base64Audio = audioPart.inlineData.data;
  const mimeType = audioPart.inlineData.mimeType || 'audio/wav';
  const byteLength = Math.round((base64Audio.length * 3) / 4);

  return {
    success: true,
    audioBase64: base64Audio,
    mimeType,
    byteLength,
    latencyMs: durationMs,
    speakers: [speaker1.name, speaker2.name],
    lineCount: lines.length,
    model: 'gemini-3.8-flash-tts',
  };
}

export async function handleAgentVideoRequest(body: {
  scriptText: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  style?: string;
  theme?: 'cyber' | 'studio' | 'cinematic' | 'anime';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  customApiKey?: string;
}) {
  if (!body.scriptText || body.scriptText.trim().length === 0) {
    throw new Error('Agent request missing scriptText parameter');
  }

  const speechResult = await generateGeminiSpeech({
    text: body.scriptText,
    voiceName: body.voiceName || 'Kore',
    style: body.style,
    customApiKey: body.customApiKey,
  });

  const durationEstSeconds = Math.max(2, Math.round(speechResult.byteLength / 48000));

  return {
    success: true,
    audioBase64: speechResult.audioBase64,
    mimeType: speechResult.mimeType,
    voiceName: speechResult.voiceName,
    model: speechResult.model,
    theme: body.theme || 'cyber',
    aspectRatio: body.aspectRatio || '16:9',
    videoSpec: {
      scriptText: body.scriptText,
      durationEstSeconds,
      fps: 30,
      captionsEnabled: true,
      audioFormat: '24kHz 16-bit Mono WAV',
    },
    message: 'Voiceover video pipeline generated for external agent. Ready for playback or client rendering.',
  };
}

export async function validateApiKey(apiKeyToTest: string) {
  if (!apiKeyToTest || apiKeyToTest.trim().length < 10) {
    throw new Error('Invalid API key format. Google AI Studio keys typically start with AIzaSy...');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKeyToTest.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const startTime = Date.now();

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Hello' }],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const latencyMs = Date.now() - startTime;
  const hasAudio = Boolean(
    response.candidates?.[0]?.content?.parts?.some((p) => p.inlineData?.data)
  );

  return {
    valid: hasAudio,
    latencyMs,
    message: hasAudio
      ? 'API Key is verified and authorized for Gemini 3.8 Speech Generation on Google AI Studio Free Tier!'
      : 'API Key accepted but returned no audio.',
  };
}
