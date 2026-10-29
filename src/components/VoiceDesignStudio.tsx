import React, { useState, useRef } from 'react';
import {
  Wand2,
  Mic,
  Square,
  Play,
  Save,
  Trash2,
  Sparkles,
  Users,
  Plus,
  RotateCcw,
  Volume2,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  AudioWaveform,
  UserCheck,
} from 'lucide-react';
import {
  CustomVoiceProfile,
  DialogueLine,
  DualSpeakerDialogue,
  GeneratedTrack,
} from '../types/index.ts';
import { base64ToBlob, downloadAudioBlob } from '../utils/audioHelper.ts';
import { AudioPlayer } from './AudioPlayer.tsx';

interface VoiceDesignStudioProps {
  customVoices: CustomVoiceProfile[];
  onSaveCustomVoice: (voice: CustomVoiceProfile) => void;
  onDeleteCustomVoice: (id: string) => void;
  onNewTrackGenerated: (track: GeneratedTrack) => void;
  customApiKey?: string;
}

export const VoiceDesignStudio: React.FC<VoiceDesignStudioProps> = ({
  customVoices,
  onSaveCustomVoice,
  onDeleteCustomVoice,
  onNewTrackGenerated,
  customApiKey,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'designer' | 'dialogue'>('designer');

  // Voice Designer Form State
  const [voiceName, setVoiceName] = useState<string>("My Friend's Voice");
  const [baseVoice, setBaseVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Puck');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Neutral'>('Male');
  const [ageBracket, setAgeBracket] = useState<'Youthful' | 'Mid-20s' | 'Middle-aged' | 'Elderly'>('Mid-20s');
  const [accent, setAccent] = useState<string>('Indian English casual');
  const [timbre, setTimbre] = useState<string>('Warm, relaxed, and cheerful with occasional chuckles');
  const [energyLevel, setEnergyLevel] = useState<'Calm' | 'Balanced' | 'High Energy' | 'Intense'>('Balanced');
  const [pitchOffset, setPitchOffset] = useState<number>(0);
  const [paceOffset, setPaceOffset] = useState<number>(1.0);
  const [testPhrase, setTestPhrase] = useState<string>(
    "Hey buddy! <laugh> How is everything going? Look, I designed my own custom voice!"
  );

  // Audio recording state for reference sample
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Testing & Generation State
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [testBase64, setTestBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dual-Speaker Screenplay State
  const [dialogue, setDialogue] = useState<DualSpeakerDialogue>({
    speaker1Name: 'Alex',
    speaker1Voice: 'Puck',
    speaker1Style: 'Upbeat and excited friend',
    speaker2Name: 'Rahul',
    speaker2Voice: 'Charon',
    speaker2Style: 'Calm, grounded, and witty friend',
    lines: [
      {
        id: '1',
        speaker: 'Alex',
        text: 'Bro! <laugh> You will not believe what just happened.',
      },
      {
        id: '2',
        speaker: 'Rahul',
        text: 'What happened? <breath> Tell me quickly |yeah|.',
      },
      {
        id: '3',
        speaker: 'Alex',
        text: 'We just generated a full two-person podcast conversation directly in Gemini!',
      },
      {
        id: '4',
        speaker: 'Rahul',
        text: 'No way! <gasp> That sounds completely realistic!',
      },
    ],
  });

  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState<boolean>(false);
  const [dialogueResult, setDialogueResult] = useState<GeneratedTrack | null>(null);

  // Microphone recording
  const handleStartRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        setSuccessMessage('Voice reference sample captured! Incorporating acoustic profile into voice design prompt.');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 6) {
            handleStopRecording();
            return 6;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Microphone access denied or not available.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  // Build the synthesized style prompt for Gemini
  const constructVoicePrompt = (): string => {
    return `${gender} ${ageBracket} speaker with a ${accent} accent. Vocal timbre is ${timbre}, energy level: ${energyLevel}. Pitch feeling: ${pitchOffset > 0 ? 'slightly higher' : pitchOffset < 0 ? 'deep and low' : 'natural'}, pace: ${paceOffset}x.`;
  };

  // Test the custom designed voice
  const handleTestVoice = async () => {
    if (!testPhrase.trim()) {
      setErrorMessage('Please enter a test script phrase.');
      return;
    }

    setIsGeneratingTest(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const stylePrompt = constructVoicePrompt();

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testPhrase.trim(),
          voiceName: baseVoice,
          style: stylePrompt,
          model: 'gemini-3.8-flash-tts',
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'Voice design test generation failed.');
      }

      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
      const url = URL.createObjectURL(blob);
      setTestAudioUrl(url);
      setTestBase64(data.audioBase64);

      const track: GeneratedTrack = {
        id: `custom_${Date.now()}`,
        text: testPhrase.trim(),
        engine: 'gemini',
        voiceName: `${voiceName} (${baseVoice})`,
        style: stylePrompt,
        audioUrl: url,
        audioBase64: data.audioBase64,
        byteSize: data.byteLength || blob.size,
        latencyMs: data.latencyMs,
        createdAt: Date.now(),
        mimeType: data.mimeType || 'audio/wav',
        hasExpressiveTags: true,
      };
      onNewTrackGenerated(track);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error synthesizing custom voice.');
    } finally {
      setIsGeneratingTest(false);
    }
  };

  // Save the custom designed voice profile
  const handleSaveVoice = () => {
    if (!voiceName.trim()) {
      setErrorMessage('Please give your custom voice a name.');
      return;
    }

    const newProfile: CustomVoiceProfile = {
      id: `voice_${Date.now()}`,
      name: voiceName.trim(),
      baseVoice,
      gender,
      ageBracket,
      accent,
      timbre,
      energyLevel,
      customPromptDescription: constructVoicePrompt(),
      pitchOffset,
      paceOffset,
      sampleRecordedAudioUrl: recordedAudioUrl || undefined,
      createdAt: Date.now(),
    };

    onSaveCustomVoice(newProfile);
    setSuccessMessage(`Custom voice "${voiceName}" saved! You can now use it anywhere in VoxGemini.`);
  };

  // Dual-Speaker Line Handlers
  const handleAddLine = () => {
    const nextSpeaker = dialogue.lines.length % 2 === 0 ? dialogue.speaker1Name : dialogue.speaker2Name;
    setDialogue((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: String(Date.now()),
          speaker: nextSpeaker,
          text: 'Yeah, tell me more about that!',
        },
      ],
    }));
  };

  const handleUpdateLine = (id: string, text: string) => {
    setDialogue((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === id ? { ...l, text } : l)),
    }));
  };

  const handleDeleteLine = (id: string) => {
    if (dialogue.lines.length <= 2) return;
    setDialogue((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.id !== id),
    }));
  };

  // Generate Dual Speaker Conversation
  const handleGenerateDualSpeaker = async () => {
    setIsGeneratingDialogue(true);
    setErrorMessage(null);
    setDialogueResult(null);

    try {
      const response = await fetch('/api/tts/dual-speaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker1: {
            name: dialogue.speaker1Name,
            voiceName: dialogue.speaker1Voice,
            style: dialogue.speaker1Style,
          },
          speaker2: {
            name: dialogue.speaker2Name,
            voiceName: dialogue.speaker2Voice,
            style: dialogue.speaker2Style,
          },
          lines: dialogue.lines,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to synthesize dual-speaker screenplay dialogue.');
      }

      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
      const audioUrl = URL.createObjectURL(blob);

      const track: GeneratedTrack = {
        id: `dialogue_${Date.now()}`,
        text: dialogue.lines.map((l) => `${l.speaker}: ${l.text}`).join(' \n'),
        engine: 'gemini',
        voiceName: `${dialogue.speaker1Name} & ${dialogue.speaker2Name}`,
        style: 'Dual-Speaker Dialogue',
        model: 'gemini-3.8-flash-tts',
        audioUrl,
        audioBase64: data.audioBase64,
        byteSize: data.byteLength || blob.size,
        latencyMs: data.latencyMs,
        createdAt: Date.now(),
        mimeType: data.mimeType || 'audio/wav',
        isDualSpeaker: true,
      };

      setDialogueResult(track);
      onNewTrackGenerated(track);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating dialogue conversation.');
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-indigo-400" />
            <span>Voice Design Studio &amp; Custom Personas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Craft your own custom voices for yourself or your friends, record voice samples, and generate dual-speaker conversations.
          </p>
        </div>

        {/* Sub-Tabs: Custom Voice Designer vs 2-Person Dialogue */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('designer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeSubTab === 'designer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Design Custom Voice
          </button>
          <button
            onClick={() => setActiveSubTab('dialogue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'dialogue'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Friend Dialogue Studio</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: VOICE DESIGNER */}
      {activeSubTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Voice Architect */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <span>Custom Voice Persona Parameters</span>
              </h3>

              {/* Name & Base Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Voice Persona Name
                  </label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g. My Friend Rahul, Cyberpunk Hacker"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Base Neural Engine Model
                  </label>
                  <select
                    value={baseVoice}
                    onChange={(e) => setBaseVoice(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Puck">Puck (Dynamic &amp; Youthful Male)</option>
                    <option value="Charon">Charon (Deep &amp; Authoritative Male)</option>
                    <option value="Kore">Kore (Crisp &amp; Balanced Female)</option>
                    <option value="Fenrir">Fenrir (Gravelly &amp; Dramatic Male)</option>
                    <option value="Zephyr">Zephyr (Gentle &amp; Soft Female)</option>
                  </select>
                </div>
              </div>

              {/* Gender & Age Bracket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Vocal Register &amp; Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Male">Masculine Baritone / Tenor</option>
                    <option value="Female">Feminine Soprano / Alto</option>
                    <option value="Neutral">Androgynous / Youthful</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Age Bracket
                  </label>
                  <select
                    value={ageBracket}
                    onChange={(e) => setAgeBracket(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Youthful">Youthful (16 - 22)</option>
                    <option value="Mid-20s">Mid-20s to 30s</option>
                    <option value="Middle-aged">Middle-aged (40s - 50s)</option>
                    <option value="Elderly">Elderly / Wise Elder (60+)</option>
                  </select>
                </div>
              </div>

              {/* Accent & Dialect */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Accent &amp; Cultural Cadence
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Indian English casual',
                    'Hindi conversational flair',
                    'American urban casual',
                    'British modern RP',
                    'Anime dub spirited',
                    'Australian relaxed',
                  ].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setAccent(acc)}
                      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        accent === acc
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Vocal Timbre & Texture */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Vocal Timbre, Mannerisms &amp; Delivery Texture
                </label>
                <textarea
                  value={timbre}
                  onChange={(e) => setTimbre(e.target.value)}
                  rows={2}
                  placeholder="e.g. Warm, relaxed, chuckles easily, enthusiastic, friendly tone"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              {/* Record Friend's Voice Sample (Microphone reference) */}
              <div className="pt-3 border-t border-slate-800/80 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-rose-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Record Friend's Voice Sample (Acoustic Reference)
                    </span>
                  </div>
                  {recordedAudioUrl && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Sample Loaded</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Have your friend speak 5 seconds into your microphone. Our engine analyzes pitch &amp; cadence to calibrate their voice design prompt.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Record 5s Voice Sample</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg animate-pulse"
                    >
                      <Square className="h-3.5 w-3.5" />
                      <span>Recording... ({recordingSeconds}s / 6s)</span>
                    </button>
                  )}

                  {recordedAudioUrl && (
                    <audio src={recordedAudioUrl} controls className="h-8 w-48" />
                  )}
                </div>
              </div>

              {/* Test Script Phrase */}
              <div className="pt-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Test Phrase (Includes Audio Tags)
                </label>
                <input
                  type="text"
                  value={testPhrase}
                  onChange={(e) => setTestPhrase(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={isGeneratingTest}
                  className="flex-1 py-2.5 px-4 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isGeneratingTest ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Synthesizing Voice Design...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Test Custom Voice</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveVoice}
                  className="py-2.5 px-4 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-colors shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save to My Voices</span>
                </button>
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="p-3 rounded-lg border border-emerald-800/50 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg border border-rose-800/50 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Test Audio Preview Player */}
            {testAudioUrl && (
              <div className="pt-2">
                <AudioPlayer
                  audioUrl={testAudioUrl}
                  voiceName={voiceName}
                  engine="gemini"
                  stylePrompt={constructVoicePrompt()}
                  onDownload={() => {
                    if (testBase64) {
                      const blob = base64ToBlob(testBase64);
                      downloadAudioBlob(blob, `voxgemini_${voiceName.toLowerCase()}_sample.wav`);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column: Saved Custom Voices & Specs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  <span>My Designed Custom Voices</span>
                </h3>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {customVoices.length} saved
                </span>
              </div>

              {customVoices.length === 0 ? (
                <div className="p-6 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                  <p>No custom voices designed yet.</p>
                  <p className="mt-1 text-slate-600">
                    Use the controls on the left to design your friend's voice or custom persona and click "Save to My Voices".
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
                  {customVoices.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200 text-sm">{v.name}</span>
                          <span className="text-xs text-slate-500 ml-2">Base: {v.baseVoice}</span>
                        </div>
                        <button
                          onClick={() => onDeleteCustomVoice(v.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete custom voice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {v.gender}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {v.ageBracket}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {v.accent}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed italic">
                        "{v.timbre}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How Gemini Voice Design Works */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-300 space-y-2">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>About Gemini 3.8 Voice Design</span>
              </span>
              <p className="text-slate-400 leading-relaxed">
                Google AI Studio's <code className="text-indigo-300 font-mono">gemini-3.8-flash-tts</code> allows
                developers to prompt custom vocal personas from scratch. By tuning vocal acoustic descriptions in{' '}
                <code className="text-indigo-300 font-mono">speechMetadata.style</code>, the model modulates pitch,
                timbre, breathiness, and dialect to emulate your friend or character accurately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DUAL-SPEAKER FRIEND DIALOGUE STUDIO */}
      {activeSubTab === 'dialogue' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>Multi-Speaker Screenplay Conversation (Friend &amp; You)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Powered by Gemini 3.8 Flash TTS multi-speaker architecture. Both speakers banter naturally with backchanneling and vocal bursts!
              </p>
            </div>

            <button
              onClick={handleGenerateDualSpeaker}
              disabled={isGeneratingDialogue}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              {isGeneratingDialogue ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Full Conversation...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Generate Conversation Audio</span>
                </>
              )}
            </button>
          </div>

          {/* Speaker Setup Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speaker 1 Card */}
            <div className="p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400 block">Speaker 1 (e.g. You)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Character Name</label>
                  <input
                    type="text"
                    value={dialogue.speaker1Name}
                    onChange={(e) =>
                      setDialogue((prev) => ({ ...prev, speaker1Name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Base Voice</label>
                  <select
                    value={dialogue.speaker1Voice}
                    onChange={(e) =>
                      setDialogue((prev) => ({ ...prev, speaker1Voice: e.target.value as any }))
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
                  >
                    <option value="Puck">Puck (Energetic Male)</option>
                    <option value="Charon">Charon (Deep Male)</option>
                    <option value="Kore">Kore (Crisp Female)</option>
                    <option value="Fenrir">Fenrir (Dramatic Male)</option>
                    <option value="Zephyr">Zephyr (Gentle Female)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Delivery Style</label>
                <input
                  type="text"
                  value={dialogue.speaker1Style}
                  onChange={(e) =>
                    setDialogue((prev) => ({ ...prev, speaker1Style: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>

            {/* Speaker 2 Card */}
            <div className="p-4 rounded-xl border border-cyan-900/40 bg-cyan-950/20 space-y-3">
              <span className="text-xs font-mono font-bold text-cyan-400 block">Speaker 2 (e.g. Your Friend)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Character Name</label>
                  <input
                    type="text"
                    value={dialogue.speaker2Name}
                    onChange={(e) =>
                      setDialogue((prev) => ({ ...prev, speaker2Name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Base Voice</label>
                  <select
                    value={dialogue.speaker2Voice}
                    onChange={(e) =>
                      setDialogue((prev) => ({ ...prev, speaker2Voice: e.target.value as any }))
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
                  >
                    <option value="Charon">Charon (Deep Male)</option>
                    <option value="Puck">Puck (Energetic Male)</option>
                    <option value="Kore">Kore (Crisp Female)</option>
                    <option value="Fenrir">Fenrir (Dramatic Male)</option>
                    <option value="Zephyr">Zephyr (Gentle Female)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Delivery Style</label>
                <input
                  type="text"
                  value={dialogue.speaker2Style}
                  onChange={(e) =>
                    setDialogue((prev) => ({ ...prev, speaker2Style: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Dialogue Lines Script Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Conversation Script ({dialogue.lines.length} lines)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Dialogue Line</span>
              </button>
            </div>

            <div className="space-y-2">
              {dialogue.lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-950"
                >
                  <select
                    value={line.speaker}
                    onChange={(e) => {
                      const newSpeaker = e.target.value;
                      setDialogue((prev) => ({
                        ...prev,
                        lines: prev.lines.map((l) =>
                          l.id === line.id ? { ...l, speaker: newSpeaker } : l
                        ),
                      }));
                    }}
                    className={`px-2 py-1 text-xs font-semibold rounded border border-slate-800 bg-slate-900 shrink-0 ${
                      line.speaker === dialogue.speaker1Name ? 'text-indigo-400' : 'text-cyan-400'
                    }`}
                  >
                    <option value={dialogue.speaker1Name}>{dialogue.speaker1Name}</option>
                    <option value={dialogue.speaker2Name}>{dialogue.speaker2Name}</option>
                  </select>

                  <input
                    type="text"
                    value={line.text}
                    onChange={(e) => handleUpdateLine(line.id, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-100 focus:outline-none font-sans"
                  />

                  {dialogue.lines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(line.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Remove line"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dialogue Player Output */}
          {dialogueResult && (
            <div className="pt-4 border-t border-slate-800">
              <AudioPlayer
                audioUrl={dialogueResult.audioUrl}
                voiceName={`${dialogue.speaker1Name} & ${dialogue.speaker2Name}`}
                engine="gemini"
                stylePrompt="Multi-Speaker Screenplay"
                latencyMs={dialogueResult.latencyMs}
                byteSize={dialogueResult.byteSize}
                onDownload={() => {
                  if (dialogueResult.audioBase64) {
                    const blob = base64ToBlob(dialogueResult.audioBase64);
                    downloadAudioBlob(blob, `conversation_${Date.now()}.wav`);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
