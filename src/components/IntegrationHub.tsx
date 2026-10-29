import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Terminal,
  FileCode,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sliders,
} from 'lucide-react';

interface IntegrationHubProps {
  currentText?: string;
  currentVoice?: string;
  currentStyle?: string;
}

type TabType = 'curl' | 'python' | 'nodejs' | 'react' | 'rest' | 'unlimited';

export const IntegrationHub: React.FC<IntegrationHubProps> = ({
  currentText = 'Did you really think that would stop me? <gasp> |yeah| You have no idea what true power sounds like! <laugh>',
  currentVoice = 'Puck',
  currentStyle = 'Passionate and fierce shonen anime protagonist',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('curl');
  const [copied, setCopied] = useState<boolean>(false);

  const [snippetText, setSnippetText] = useState<string>(currentText);
  const [snippetVoice, setSnippetVoice] = useState<string>(currentVoice);
  const [snippetStyle, setSnippetStyle] = useState<string>(currentStyle);
  const [modelType, setModelType] = useState<string>('gemini-3.8-flash-tts');

  const getCurlSnippet = () => {
    return `# 1. Set your free Google AI Studio API key (get one free at aistudio.google.com/apikey)
export GEMINI_API_KEY="YOUR_FREE_API_KEY"

# 2. Call Google AI Studio Gemini 3.8 Flash TTS with Vocal Bursts & Expressions
curl "https://generativelanguage.googleapis.com/v1beta/models/${modelType}:generateContent?key=\${GEMINI_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": ${JSON.stringify(snippetText)},
            "speechMetadata": {
              "style": ${JSON.stringify(snippetStyle)}
            }
          }
        ]
      }
    ],
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": {
            "voiceName": "${snippetVoice}"
          }
        }
      }
    }
  }' > response.json

# 3. Extract base64 audio and save as playable 24kHz WAV
cat response.json | jq -r '.candidates[0].content.parts[0].inlineData.data' | base64 -d > speech_${snippetVoice.toLowerCase()}.wav
echo "Audio saved to speech_${snippetVoice.toLowerCase()}.wav"`;
  };

  const getPythonSnippet = () => {
    return `# Install official Google GenAI SDK:
# pip install google-genai

import os
import base64
from google import genai
from google.genai import types

# 1. Initialize client with free Google AI Studio key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# 2. Generate expressive speech with audio tags (<laugh>, <gasp>, |yeah|)
response = client.models.generate_content(
    model="${modelType}",
    contents=[
        types.Content(
            role="user",
            parts=[
                types.Part(
                    # Supports vocal bursts: <laugh>, <gasp>, <breath>, <sigh>, and backchannels: |yeah|, |mhm|
                    text=${JSON.stringify(snippetText)},
                    speech_metadata=types.SpeechMetadata(
                        style=${JSON.stringify(snippetStyle)}
                    ),
                )
            ],
        )
    ],
    config=types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="${snippetVoice}"
                )
            )
        ),
    ),
)

# 3. Save decoded WAV bytes
part = response.candidates[0].content.parts[0]
if part.inline_data and part.inline_data.data:
    audio_bytes = base64.b64decode(part.inline_data.data)
    with open("output_${snippetVoice.toLowerCase()}.wav", "wb") as f:
        f.write(audio_bytes)
    print("Expressive audio saved to output_${snippetVoice.toLowerCase()}.wav")`;
  };

  const getNodeJsSnippet = () => {
    return `// Install modern @google/genai SDK:
// npm install @google/genai

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

// 1. Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function generateExpressiveVoice() {
  const response = await ai.models.generateContent({
    // 'gemini-3.8-flash-tts' is calibrated for vocal bursts (<laugh>, <gasp>) and voice design
    model: "${modelType}",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: ${JSON.stringify(snippetText)},
            speechMetadata: {
              style: ${JSON.stringify(snippetStyle)},
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "${snippetVoice}" },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No speech audio returned by model");
  }

  // Returns complete 24kHz mono 16-bit WAV file with RIFF header
  const wavBuffer = Buffer.from(base64Audio, "base64");
  await fs.promises.writeFile("output_${snippetVoice.toLowerCase()}.wav", wavBuffer);
  console.log("Audio generated and saved to output_${snippetVoice.toLowerCase()}.wav");
  return wavBuffer;
}`;
  };

  const getReactSnippet = () => {
    return `// Drop-in React Hook: useGeminiExpressiveSpeech.ts
import { useState, useCallback } from "react";

export function useGeminiExpressiveSpeech() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(
    async (
      text: string,
      voiceName: string = "${snippetVoice}",
      style: string = ${JSON.stringify(snippetStyle)}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text, // e.g. "Wait a second... <gasp> |yeah| That worked! <laugh>"
            voiceName,
            style,
            model: "${modelType}",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Speech generation failed");

        // Play in browser via Base64 WAV data URL
        const audio = new Audio("data:audio/wav;base64," + data.audioBase64);
        await audio.play();
        return audio;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { speak, isLoading, error };
}

// Example Component:
// function ExpressiveButton() {
//   const { speak, isLoading } = useGeminiExpressiveSpeech();
//   return (
//     <button onClick={() => speak("Ha! <laugh> You cannot defeat me!")} disabled={isLoading}>
//       {isLoading ? "Generating..." : "Speak Battle Cry"}
//     </button>
//   );
// }`;
  };

  const getRestSnippet = () => {
    return `// POST /api/tts/generate
// Content-Type: application/json

// Request Body:
{
  "text": ${JSON.stringify(snippetText)},
  "voiceName": "${snippetVoice}",
  "style": ${JSON.stringify(snippetStyle)},
  "model": "${modelType}"
}

// Success Response (HTTP 200):
{
  "success": true,
  "audioBase64": "<base64_encoded_riff_wav>",
  "mimeType": "audio/wav",
  "byteLength": 84210,
  "latencyMs": 480,
  "voiceName": "${snippetVoice}",
  "style": "${snippetStyle}",
  "model": "${modelType}",
  "hasExpressiveTags": true
}`;
  };

  const getUnlimitedBrowserSnippet = () => {
    return `// 100% Free Unlimited Browser Web Speech Fallback (Zero Network & Zero API Key):
export function speakUnlimited(text, options = {}) {
  if (!('speechSynthesis' in window)) {
    console.warn("Web Speech API not supported");
    return;
  }

  // Cancel prior speech
  window.speechSynthesis.cancel();

  // Clean expression tags if present
  const cleanText = text.replace(/<[^>]*>|\\|[^|]*\\||\\[[^\\]]*\\]/g, " ");

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;

  window.speechSynthesis.speak(utterance);
}

// Example:
speakUnlimited("Hello world! Zero API cost, unlimited speech.");`;
  };

  const getCode = () => {
    switch (activeTab) {
      case 'curl':
        return getCurlSnippet();
      case 'python':
        return getPythonSnippet();
      case 'nodejs':
        return getNodeJsSnippet();
      case 'react':
        return getReactSnippet();
      case 'rest':
        return getRestSnippet();
      case 'unlimited':
        return getUnlimitedBrowserSnippet();
      default:
        return getCurlSnippet();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Code className="h-4 w-4 text-indigo-400" />
            <span>Developer Integration Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Drop-in code snippets to integrate Gemini 3.8 Flash TTS with vocal expressions into your applications.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-white" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Code Snippet</span>
            </>
          )}
        </button>
      </div>

      {/* Parameter Live Tuning Strip */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Target Model</label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="gemini-3.8-flash-tts">gemini-3.8-flash-tts (Expressive)</option>
            <option value="gemini-3.8-flash-lite-tts">gemini-3.8-flash-lite-tts (Fast)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Target Voice</label>
          <select
            value={snippetVoice}
            onChange={(e) => setSnippetVoice(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((v) => (
              <option key={v} value={v}>
                {v} Voice
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Delivery Style</label>
          <input
            type="text"
            value={snippetStyle}
            onChange={(e) => setSnippetStyle(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Script Text</label>
          <input
            type="text"
            value={snippetText}
            onChange={(e) => setSnippetText(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Code Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Language Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'curl', label: 'cURL / Shell', icon: Terminal },
              { id: 'python', label: 'Python (google-genai)', icon: FileCode },
              { id: 'nodejs', label: 'Node.js (@google/genai)', icon: Layers },
              { id: 'react', label: 'React Hook', icon: Sparkles },
              { id: 'rest', label: 'REST API Payload', icon: Globe },
              { id: 'unlimited', label: 'Unlimited Free JS', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-amber-300">
            <span>model: {modelType}</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[520px]">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed selection:bg-indigo-600/50">
            <code>{getCode()}</code>
          </pre>
        </div>
      </div>

      {/* Expression Tags Audio Format Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Supported Vocal Bursts & Expression Formats</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-amber-400 font-mono font-medium block">&lt;laugh&gt; &lt;gasp&gt; &lt;breath&gt;</span>
            <p className="text-slate-400 mt-1">
              Natural involuntary human vocalizations produced directly by Google's neural speech synthesis model.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 font-mono font-medium block">|yeah| |mhm| |aha|</span>
            <p className="text-slate-400 mt-1">
              Conversational podcast backchannels and interjections for dialogue realism and responsive flow.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-indigo-400 font-mono font-medium block">[excited] [whisper] [pause: 1s]</span>
            <p className="text-slate-400 mt-1">
              Direct delivery and pacing modulations guiding pitch, energy, tempo, and pauses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
