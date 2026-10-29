import React, { useState } from 'react';
import {
  Bot,
  Code,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Zap,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  FileCode,
  Globe,
  Loader2,
} from 'lucide-react';

export const AgentIntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'genai' | 'langchain' | 'rest' | 'crewai'>('genai');
  const [copied, setCopied] = useState<boolean>(false);

  // Live Agent Simulation State
  const [simScript, setSimScript] = useState<string>(
    'Hello from your autonomous app agent! <laugh> I just generated this voiceover video directly from my internal reasoning loop.'
  );
  const [simVoice, setSimVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Puck');
  const [simTheme, setSimTheme] = useState<'cyber' | 'anime' | 'studio' | 'cinematic'>('cyber');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const getGeminiAgentCode = () => {
    return `# Python: Google GenAI Agent Tool Declaration for your app's Agent
from google import genai
from google.genai import types
import requests
import json

# 1. Define the tool specification for your agent:
generate_video_tool = types.FunctionDeclaration(
    name="generate_voiceover_video",
    description="Generates an expressive AI voiceover video with audio waveforms and subtitles using Google Gemini TTS.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "script_text": types.Schema(
                type=types.Type.STRING,
                description="The dialogue or narration text. Can include vocal bursts like <laugh>, <gasp>, or <breath>.",
            ),
            "voice_name": types.Schema(
                type=types.Type.STRING,
                description="Selected voice: 'Kore', 'Puck', 'Charon', 'Fenrir', or 'Zephyr'.",
                enum=["Kore", "Puck", "Charon", "Fenrir", "Zephyr"],
            ),
            "theme": types.Schema(
                type=types.Type.STRING,
                description="Visual video theme: 'cyber', 'anime', 'studio', or 'cinematic'.",
                enum=["cyber", "anime", "studio", "cinematic"],
            ),
            "aspect_ratio": types.Schema(
                type=types.Type.STRING,
                description="Video dimensions: '16:9' (landscape), '9:16' (vertical), or '1:1' (square).",
                enum=["16:9", "9:16", "1:1"],
            ),
        },
        required=["script_text"],
    ),
)

# 2. Attach tool to your agent:
client = genai.Client()
model = "gemini-3.8-flash"  # or your agent model

# 3. Agent Tool Execution Handler in your backend:
def execute_generate_video_tool(arguments):
    response = requests.post(
        "http://localhost:3000/api/agent/generate-video",
        json={
            "scriptText": arguments.get("script_text"),
            "voiceName": arguments.get("voice_name", "Puck"),
            "theme": arguments.get("theme", "cyber"),
            "aspectRatio": arguments.get("aspect_ratio", "16:9"),
        },
    )
    return response.json()

print("Agent tool ready for autonomous video creation!")`;
  };

  const getLangChainCode = () => {
    return `# Python: LangChain / LangGraph Tool for your In-App Agent
from langchain.tools import tool
import requests

@tool
def create_voiceover_video(
    script_text: str,
    voice_name: str = "Puck",
    theme: str = "cyber",
    aspect_ratio: str = "16:9",
) -> dict:
    """
    Creates an expressive AI voiceover video with synchronized waveform and subtitles.
    Supports vocal bursts: <laugh>, <gasp>, <breath>, |yeah|, and emotions.
    """
    api_url = "http://localhost:3000/api/agent/generate-video"
    payload = {
        "scriptText": script_text,
        "voiceName": voice_name,
        "theme": theme,
        "aspectRatio": aspect_ratio,
    }
    
    res = requests.post(api_url, json=payload)
    if res.status_code == 200:
        data = res.json()
        return {
            "status": "success",
            "voice": data.get("voiceName"),
            "model": data.get("model"),
            "audio_base64": data.get("audioBase64")[:30] + "...(truncated)",
            "duration_est": data.get("videoSpec", {}).get("durationEstSeconds"),
            "message": "Video & audio generated successfully for agent output."
        }
    return {"status": "error", "message": res.text}

# Now simply add create_voiceover_video to your agent's tools list:
# agent = create_react_agent(llm, tools=[create_voiceover_video])`;
  };

  const getRestAgentCode = () => {
    return `// JavaScript / TypeScript: Direct In-App Agent HTTP Call
// Any agent in your app can trigger video & speech generation via:

async function agentGenerateVideo(script, voice = "Puck", theme = "cyber") {
  const response = await fetch("/api/agent/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scriptText: script, // e.g. "Mission accomplished! <laugh> Target reached."
      voiceName: voice,   // 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'
      theme: theme,       // 'cyber' | 'anime' | 'studio' | 'cinematic'
      aspectRatio: "16:9" // '16:9' | '9:16' | '1:1'
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error);

  console.log("Agent received audio & video payload:", result);
  // Returns base64 24kHz WAV + video metadata specification
  return result;
}`;
  };

  const getCrewAiCode = () => {
    return `# CrewAI / AutoGen Custom Tool
from crewai.tools import BaseTool
import requests

class VoiceoverVideoTool(BaseTool):
    name: str = "Generate Voiceover Video"
    description: str = "Generate an AI voiceover video with emotional audio tags (<laugh>, <gasp>) and waveforms."

    def _run(self, script_text: str, voice_name: str = "Kore") -> str:
        res = requests.post(
            "http://localhost:3000/api/agent/generate-video",
            json={"scriptText": script_text, "voiceName": voice_name}
        )
        return str(res.json().get("message", "Video generated"))`;
  };

  const getCode = () => {
    switch (activeTab) {
      case 'genai':
        return getGeminiAgentCode();
      case 'langchain':
        return getLangChainCode();
      case 'rest':
        return getRestAgentCode();
      case 'crewai':
        return getCrewAiCode();
      default:
        return getGeminiAgentCode();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateAgent = async () => {
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/agent/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: simScript,
          voiceName: simVoice,
          theme: simTheme,
          aspectRatio: '16:9',
        }),
      });

      const data = await res.json();
      setSimResult(data);
    } catch (err: any) {
      setSimResult({ error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="h-4 w-4 text-emerald-400" />
            <span>In-App AI Agent Direct Video Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Everything your app's AI agent needs to autonomously generate expressive voiceovers and video files directly.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-white" />
              <span>Copied Agent Code!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Agent Tool Code</span>
            </>
          )}
        </button>
      </div>

      {/* How it works for your agent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
          <span className="text-xs font-mono font-bold text-indigo-400">01. Attach Tool</span>
          <h3 className="text-sm font-semibold text-slate-200">Register in your Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Provide the tool definition below to your LLM/Agent (Gemini Function Calling, LangChain, or Custom).
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
          <span className="text-xs font-mono font-bold text-indigo-400">02. Autonomous Call</span>
          <h3 className="text-sm font-semibold text-slate-200">Agent Dispatches Video</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When the user or task asks for a video response, the agent calls{' '}
            <code className="text-indigo-300 font-mono">generate_voiceover_video</code> with script text and expressions.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
          <span className="text-xs font-mono font-bold text-indigo-400">03. Instant Video</span>
          <h3 className="text-sm font-semibold text-slate-200">Zero Cost Execution</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Runs using Google AI Studio free tier or client-side canvas, returning synchronized video and audio.
          </p>
        </div>
      </div>

      {/* Live Agent Simulator Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Live Agent Tool Simulator (Test In Real Time)</span>
          </h3>
          <span className="text-xs text-indigo-400 font-mono">POST /api/agent/generate-video</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-400">Agent Script Parameter</label>
            <input
              type="text"
              value={simScript}
              onChange={(e) => setSimScript(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 font-sans focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-400">Voice</label>
              <select
                value={simVoice}
                onChange={(e) => setSimVoice(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">Theme</label>
              <select
                value={simTheme}
                onChange={(e) => setSimTheme(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="cyber">Cyber</option>
                <option value="anime">Anime</option>
                <option value="studio">Studio</option>
                <option value="cinematic">Cinematic</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulateAgent}
          disabled={isSimulating || !simScript.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors"
        >
          {isSimulating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Agent Executing Tool...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Simulate In-App Agent Call</span>
            </>
          )}
        </button>

        {simResult && (
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Agent Tool Response: Success (HTTP 200)</span>
            </div>
            <pre className="text-[11px] text-slate-400 overflow-x-auto p-2 rounded bg-slate-900 border border-slate-800/80">
              {JSON.stringify(
                {
                  ...simResult,
                  audioBase64: simResult.audioBase64
                    ? `${simResult.audioBase64.substring(0, 36)}... (RIFF WAV 24kHz)`
                    : undefined,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Code Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'genai', label: 'Google GenAI Function Calling', icon: Sparkles },
              { id: 'langchain', label: 'LangChain / LangGraph Tool', icon: Layers },
              { id: 'rest', label: 'Node.js / REST Fetch', icon: Globe },
              { id: 'crewai', label: 'CrewAI / AutoGen', icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>Agent Ready</span>
          </div>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px]">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed selection:bg-indigo-600/50">
            <code>{getCode()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
