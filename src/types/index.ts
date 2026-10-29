export type GenerationEngine = 'gemini' | 'browser';

export type VoiceCategory = 'All' | 'Storyteller' | 'Commercial' | 'Calm' | 'Anime' | 'Custom';

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

export interface CustomVoiceProfile {
  id: string;
  name: string;
  baseVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  gender: 'Male' | 'Female' | 'Neutral';
  ageBracket: 'Youthful' | 'Mid-20s' | 'Middle-aged' | 'Elderly';
  accent: string;
  timbre: string;
  energyLevel: 'Calm' | 'Balanced' | 'High Energy' | 'Intense';
  customPromptDescription: string;
  pitchOffset: number;
  paceOffset: number;
  sampleRecordedAudioUrl?: string;
  createdAt: number;
}

export interface DialogueLine {
  id: string;
  speaker: string; // 'Speaker 1' or 'Speaker 2'
  text: string;
}

export interface DualSpeakerDialogue {
  speaker1Name: string;
  speaker1Voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  speaker1Style: string;
  speaker2Name: string;
  speaker2Voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  speaker2Style: string;
  lines: DialogueLine[];
}

export interface GeneratedTrack {
  id: string;
  text: string;
  engine: GenerationEngine;
  voiceName: string;
  style?: string;
  model?: string;
  audioUrl: string;
  audioBase64?: string;
  duration?: number;
  byteSize: number;
  latencyMs: number;
  createdAt: number;
  mimeType: string;
  hasExpressiveTags?: boolean;
  isDualSpeaker?: boolean;
}

export interface ScriptPreset {
  id: string;
  title: string;
  category: 'Storyteller' | 'Commercial' | 'Calm' | 'Anime' | 'General';
  recommendedVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  recommendedStyle: string;
  text: string;
  tagsUsed?: string[];
}
