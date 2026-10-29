import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  Zap,
  Sliders,
  FileText,
  RotateCcw,
  Play,
  Check,
  AlertCircle,
  Loader2,
  Smile,
  Flame,
  BookOpen,
  Tv,
  Heart,
  Theater,
  Quote,
} from 'lucide-react';
import {
  GenerationEngine,
  VoiceInfo,
  GeneratedTrack,
  ScriptPreset,
  VoiceCategory,
} from '../types/index.ts';
import { CATEGORIZED_VOICES, detectExpressiveTags } from '../server/geminiTts.ts';
import {
  getBrowserVoices,
  speakBrowserSpeech,
  stopBrowserSpeech,
  isBrowserSpeechSupported,
} from '../utils/browserTts.ts';
import { base64ToBlob, downloadAudioBlob } from '../utils/audioHelper.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import { ExpressionTagBar } from './ExpressionTagBar.tsx';

interface VoicePlaygroundProps {
  onGeneratedTrack: (track: GeneratedTrack) => void;
  activeTrack: GeneratedTrack | null;
  onSelectTrack: (track: GeneratedTrack | null) => void;
  customApiKey?: string;
}

const SAMPLE_PRESETS: ScriptPreset[] = [
  {
    id: 'anime-battle',
    title: 'Anime Battle Climax',
    category: 'Anime',
    recommendedVoice: 'Puck',
    recommendedStyle: 'Passionate and fierce shonen anime protagonist',
    text: 'Did you really think that would stop me? <gasp> |yeah| You have no idea what true determination sounds like! <laugh> Now witness my final technique!',
    tagsUsed: ['<gasp>', '|yeah|', '<laugh>'],
  },
  {
    id: 'anime-villain',
    title: 'Dark Fantasy Overlord',
    category: 'Anime',
    recommendedVoice: 'Fenrir',
    recommendedStyle: 'Sinister, gravelly, and commanding dark anime villain',
    text: 'How amusing. <laugh> You traveled across oceans of ash just to kneel before my throne? <breath> Your courage is pitiful.',
    tagsUsed: ['<laugh>', '<breath>'],
  },
  {
    id: 'podcast-comedy',
    title: 'Standup & Banter',
    category: 'Commercial',
    recommendedVoice: 'Puck',
    recommendedStyle: 'Enthusiastic podcast host bursting into laughter',
    text: 'So I told my team we could build an entire voice app with zero server costs, and they looked at me like I had lost my mind! <laugh> |mhm| But here we are, doing exactly that!',
    tagsUsed: ['<laugh>', '|mhm|'],
  },
  {
    id: 'midnight-mystery',
    title: 'Whispered Ghost Story',
    category: 'Storyteller',
    recommendedVoice: 'Charon',
    recommendedStyle: 'Eerie, measured, deep suspense narrator',
    text: 'The lantern flickered out. <breath> In the pitch black corridor, something stepped forward... <gasp> and breathed against the frosted glass.',
    tagsUsed: ['<breath>', '<gasp>'],
  },
  {
    id: 'mindful-calm',
    title: 'Serene Breathwork',
    category: 'Calm',
    recommendedVoice: 'Zephyr',
    recommendedStyle: 'Soft, gentle, and quiet bedtime companion',
    text: 'Let your shoulders drop down. <breath> Inhale deeply through the nose, holding the warmth inside... <sigh> and release everything you no longer need.',
    tagsUsed: ['<breath>', '<sigh>'],
  },
  {
    id: 'tech-explainer',
    title: 'AI Studio Demo',
    category: 'Commercial',
    recommendedVoice: 'Kore',
    recommendedStyle: 'Clear, authoritative, and articulate tech presenter',
    text: 'Welcome to VoxGemini Studio. You can now inject real human vocal bursts like laughter, gasps, and whispers directly into your voice synthesis pipelines.',
    tagsUsed: [],
  },
];

const STYLE_CHIPS = [
  'Clear, professional explainer',
  'Warm and conversational podcast host',
  'Passionate anime battle protagonist',
  'Sinister dark anime overlord',
  'Gentle whispering mindfulness guide',
  'Deep cinematic documentary trailer',
];

export const VoicePlayground: React.FC<VoicePlaygroundProps> = ({
  onGeneratedTrack,
  activeTrack,
  onSelectTrack,
  customApiKey,
}) => {
  const [text, setText] = useState<string>(
    'Did you really think that would stop me? <gasp> |yeah| You have no idea what true determination sounds like! <laugh> Now witness my final technique!'
  );
  const [engine, setEngine] = useState<GenerationEngine>('gemini');
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Puck');
  const [selectedCategory, setSelectedCategory] = useState<VoiceCategory>('All');
  const [stylePrompt, setStylePrompt] = useState<string>('Passionate and fierce shonen anime protagonist');
  const [modelMode, setModelMode] = useState<'auto' | 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts'>('auto');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Browser speech settings
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoiceURI, setSelectedBrowserVoiceURI] = useState<string>('');
  const [browserRate, setBrowserRate] = useState<number>(1.0);
  const [browserPitch, setBrowserPitch] = useState<number>(1.0);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasTags = detectExpressiveTags(text);
  const resolvedModel =
    modelMode === 'auto'
      ? hasTags
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts'
      : modelMode;

  // Load browser voices on mount
  useEffect(() => {
    getBrowserVoices().then((voices) => {
      setBrowserVoices(voices);
      if (voices.length > 0 && !selectedBrowserVoiceURI) {
        const enVoice = voices.find((v) => v.lang.startsWith('en') || v.default) || voices[0];
        setSelectedBrowserVoiceURI(enVoice.voiceURI);
      }
    });
  }, []);

  // Filter voices based on category
  const filteredVoices = CATEGORIZED_VOICES.filter((v) => {
    if (selectedCategory === 'All') return true;
    return v.category === selectedCategory;
  });

  // Insert tag at cursor position in textarea
  const handleInsertTag = (tag: string, isWrapTag?: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + ' ' + tag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let newCursorPos = start + tag.length;

    if (isWrapTag) {
      const closingTag = tag.replace('<', '</');
      if (selectedText.length > 0) {
        replacement = `${tag}${selectedText}${closingTag}`;
        newCursorPos = start + replacement.length;
      } else {
        replacement = `${tag}secret phrase${closingTag}`;
        newCursorPos = start + tag.length + 13;
      }
    } else {
      replacement = tag + ' ';
      newCursorPos = start + replacement.length;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleApplyPreset = (preset: ScriptPreset) => {
    setText(preset.text);
    setSelectedVoice(preset.recommendedVoice);
    setStylePrompt(preset.recommendedStyle);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter text before generating audio.');
      return;
    }

    setErrorMessage(null);

    // BROWSER SPEECH ENGINE (100% Free, Unlimited Fallback)
    if (engine === 'browser') {
      if (!isBrowserSpeechSupported()) {
        setErrorMessage('Web Speech Synthesis is not supported in this browser.');
        return;
      }

      setIsBrowserSpeaking(true);
      // Strip XML/bracket tags for standard browser speech
      const cleanBrowserText = text.replace(/<[^>]*>|\|[^|]*\||\[[^\]]*\]/g, ' ');

      const voiceObj = browserVoices.find((v) => v.voiceURI === selectedBrowserVoiceURI);
      const voiceLabel = voiceObj ? voiceObj.name : 'System Voice';

      speakBrowserSpeech({
        text: cleanBrowserText,
        voiceURI: selectedBrowserVoiceURI,
        rate: browserRate,
        pitch: browserPitch,
        onStart: () => setIsBrowserSpeaking(true),
        onEnd: () => setIsBrowserSpeaking(false),
        onError: () => {
          setIsBrowserSpeaking(false);
          setErrorMessage('Browser speech synthesis encountered an error.');
        },
      });

      const track: GeneratedTrack = {
        id: `browser_${Date.now()}`,
        text,
        engine: 'browser',
        voiceName: voiceLabel,
        style: `Speed: ${browserRate}x, Pitch: ${browserPitch}`,
        audioUrl: '',
        byteSize: text.length * 2,
        latencyMs: 12,
        createdAt: Date.now(),
        mimeType: 'audio/speech-synthesis',
      };
      onGeneratedTrack(track);
      return;
    }

    // GEMINI SPEECH ENGINE (Gemini 3.8 Flash TTS / Lite TTS)
    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice,
          style: stylePrompt.trim() || undefined,
          model: modelMode === 'auto' ? undefined : modelMode,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to generate voice with Google Gemini.');
      }

      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
      const audioUrl = URL.createObjectURL(blob);

      const newTrack: GeneratedTrack = {
        id: `gemini_${Date.now()}`,
        text: text.trim(),
        engine: 'gemini',
        voiceName: selectedVoice,
        style: stylePrompt,
        model: data.model,
        hasExpressiveTags: data.hasExpressiveTags,
        audioUrl,
        audioBase64: data.audioBase64,
        byteSize: data.byteLength || blob.size,
        latencyMs: data.latencyMs || Date.now() - startTime,
        createdAt: Date.now(),
        mimeType: data.mimeType || 'audio/wav',
      };

      onGeneratedTrack(newTrack);
      onSelectTrack(newTrack);
    } catch (err: any) {
      console.error('Speech generation error:', err);
      setErrorMessage(
        err.message ||
          'Failed to connect to Gemini Voice API. Ensure your network is active or switch to Free Browser Voice.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadActiveTrack = () => {
    if (!activeTrack?.audioBase64) return;
    const blob = base64ToBlob(activeTrack.audioBase64, activeTrack.mimeType);
    const filename = `voxgemini_${activeTrack.voiceName.toLowerCase()}_${Date.now()}.wav`;
    downloadAudioBlob(blob, filename);
  };

  return (
    <div className="space-y-6">
      {/* Engine Switcher Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Voice Synthesis Engine</span>
            {hasTags && engine === 'gemini' && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Expressive Audio Tags Active
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between Google AI Studio neural speech and 100% free unlimited browser voices.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setEngine('gemini')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              engine === 'gemini'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Google Gemini 3.8 TTS</span>
          </button>
          <button
            onClick={() => setEngine('browser')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
              engine === 'browser'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Unlimited Free Browser</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Text & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Script / Prompt Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            {/* Expression Tags Bar (Vocal Bursts & Backchanneling) */}
            <ExpressionTagBar onInsertTag={handleInsertTag} />

            <div className="flex items-center justify-between pt-1">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Text Script</span>
              </label>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="font-mono tabular-nums">{text.length} chars</span>
                <span>·</span>
                <span className="font-mono tabular-nums">
                  {text.trim() ? text.trim().split(/\s+/).length : 0} words
                </span>
                {text.length > 0 && (
                  <>
                    <span>·</span>
                    <button
                      onClick={() => setText('')}
                      className="hover:text-rose-400 transition-colors"
                      title="Clear text"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Type your script here... Use expression buttons above to insert <laugh>, <gasp>, or [excited]!"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-colors font-sans"
            />

            {/* Presets Row */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Featured Expressive Presets:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800/70 hover:bg-slate-800 hover:text-white rounded border border-slate-700/60 transition-colors whitespace-nowrap"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Audio Player Preview */}
          {activeTrack && activeTrack.audioUrl && (
            <div className="pt-2">
              <AudioPlayer
                audioUrl={activeTrack.audioUrl}
                voiceName={activeTrack.voiceName}
                engine={activeTrack.engine}
                stylePrompt={activeTrack.style}
                latencyMs={activeTrack.latencyMs}
                byteSize={activeTrack.byteSize}
                onDownload={handleDownloadActiveTrack}
              />
            </div>
          )}

          {/* Browser Speech Active Status Banner */}
          {engine === 'browser' && isBrowserSpeaking && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-cyan-800/40 bg-cyan-950/20 text-cyan-300">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-medium">
                  Browser Web Speech engine is currently speaking...
                </span>
              </div>
              <button
                onClick={() => {
                  stopBrowserSpeech();
                  setIsBrowserSpeaking(false);
                }}
                className="px-3 py-1 text-xs font-medium text-cyan-200 bg-cyan-900/60 hover:bg-cyan-900 rounded border border-cyan-700 transition-colors"
              >
                Stop Speech
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-rose-900/50 bg-rose-950/30 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Generation Error</p>
                <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Categorized Voice Explorer & Tuning Controls */}
        <div className="lg:col-span-5 space-y-4">
          {engine === 'gemini' ? (
            /* Categorized Voice Cards */
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-indigo-400" />
                  <span>Categorized Voice Personas</span>
                </label>
                <span className="text-xs text-indigo-400 font-mono">
                  {resolvedModel}
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
                {(['All', 'Storyteller', 'Commercial', 'Calm', 'Anime'] as VoiceCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Voice Cards */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredVoices.map((v, idx) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div
                      key={`${v.id}-${idx}`}
                      onClick={() => {
                        setSelectedVoice(v.id);
                        if (v.recommendedStyles[0]) {
                          setStylePrompt(v.recommendedStyles[0]);
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100 text-sm">
                            {v.name}
                          </span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-slate-400">{v.category}</span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-indigo-300 font-medium">
                            {v.characterArchetype}
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {v.description}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
                        <span className="italic truncate max-w-[280px]">
                          "{v.sampleQuote}"
                        </span>
                        <span className="text-indigo-400 font-mono text-[11px] shrink-0">
                          {v.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Style Direction */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Voice Delivery Style Direction</span>
                  <span className="text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="e.g. Warm and friendly, clear news anchor, dramatic narrator"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap gap-1 pt-1">
                  {STYLE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setStylePrompt(chip)}
                      className="px-2 py-0.5 text-xs text-slate-400 bg-slate-950 hover:bg-slate-800 hover:text-slate-200 rounded border border-slate-800 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Browser Speech Engine Controls */
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span>Unlimited Free Browser Engine</span>
                </label>
                <span className="text-xs text-cyan-400 font-mono">Zero API Cost</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Select System Voice ({browserVoices.length} available)
                  </label>
                  <select
                    value={selectedBrowserVoiceURI}
                    onChange={(e) => setSelectedBrowserVoiceURI(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {browserVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}) {v.default ? '— Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Speed / Rate</span>
                    <span className="font-mono tabular-nums">{browserRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={browserRate}
                    onChange={(e) => setBrowserRate(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span>Pitch</span>
                    <span className="font-mono tabular-nums">{browserPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={browserPitch}
                    onChange={(e) => setBrowserPitch(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-medium text-slate-300">Unlimited Local Playback</p>
                  <p>
                    Runs 100% locally in your browser. Generates instant speech without API key limits or network data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
              isGenerating || !text.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : engine === 'gemini'
                ? hasTags
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Synthesizing Expressive Speech with Gemini...</span>
              </>
            ) : engine === 'gemini' ? (
              <>
                <Sparkles className="h-4 w-4" />
                <span>
                  Generate {hasTags ? 'Expressive ' : ''}Voice ({selectedVoice})
                </span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Speak Text Now (Unlimited Free)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
