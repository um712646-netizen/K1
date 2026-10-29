import React, { useState } from 'react';
import {
  Video,
  Play,
  Download,
  Sparkles,
  Sliders,
  Layers,
  FileVideo,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Film,
  Zap,
  Cloud,
} from 'lucide-react';
import { GeneratedTrack } from '../types/index.ts';
import { renderVoiceoverVideo, VideoRenderResult } from '../utils/videoRenderer.ts';
import { base64ToBlob } from '../utils/audioHelper.ts';
import { DriveExportModal } from './DriveExportModal.tsx';

interface VideoGeneratorProps {
  tracks: GeneratedTrack[];
  activeTrack: GeneratedTrack | null;
  onSelectTrack: (track: GeneratedTrack) => void;
  customApiKey?: string;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  tracks,
  activeTrack,
  onSelectTrack,
  customApiKey,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    activeTrack?.id || (tracks[0]?.id ?? '')
  );
  const [theme, setTheme] = useState<'cyber' | 'studio' | 'cinematic' | 'anime'>('cyber');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  // Render state
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderedVideo, setRenderedVideo] = useState<VideoRenderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);

  // Find the selected track
  const currentTrack = tracks.find((t) => t.id === selectedTrackId) || activeTrack || tracks[0];

  const handleStartRender = async () => {
    if (!currentTrack) {
      setErrorMessage('Please select or generate an audio track first in the Voice Playground.');
      return;
    }

    let audioUrl = currentTrack.audioUrl;

    // If audioUrl was lost on reload but base64 exists, create blob URL
    if (!audioUrl && currentTrack.audioBase64) {
      const blob = base64ToBlob(currentTrack.audioBase64, currentTrack.mimeType);
      audioUrl = URL.createObjectURL(blob);
    }

    if (!audioUrl) {
      setErrorMessage(
        'Audio data is not available for this track. Please generate a new speech clip in the Playground.'
      );
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setErrorMessage(null);
    setRenderedVideo(null);

    try {
      const result = await renderVoiceoverVideo({
        audioUrl,
        scriptText: currentTrack.text,
        voiceName: currentTrack.voiceName,
        theme,
        aspectRatio,
        showCaptions,
        onProgress: (p) => setRenderProgress(Math.round(p * 100)),
      });

      setRenderedVideo(result);
    } catch (err: any) {
      console.error('Video rendering error:', err);
      setErrorMessage(err.message || 'Failed to render video. Check browser canvas permissions.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!renderedVideo) return;
    const a = document.createElement('a');
    a.href = renderedVideo.videoUrl;
    a.download = `voxgemini_agent_video_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Film className="h-4 w-4 text-indigo-400" />
            <span>AI Voice-to-Video Studio (Agent Pipeline)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Turn your Gemini voiceovers into complete animated videos with synchronized waveforms and subtitles for your app's AI agent.
          </p>
        </div>

        {renderedVideo && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVideo}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Video</span>
            </button>
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-indigo-100 bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap shrink-0"
              title="Save to Google Drive with public shareable link"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>Save to Drive (Public)</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Select Audio Track */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <label className="text-sm font-semibold text-slate-200 block">
              1. Select Source Voiceover
            </label>

            {tracks.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                <p>No audio tracks generated yet.</p>
                <p className="mt-1 text-slate-500">
                  Head over to the Voice Playground to generate your first voiceover, or use demo preset.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tracks.map((t) => {
                  const isSelected = (currentTrack && currentTrack.id === t.id) || selectedTrackId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTrackId(t.id);
                        onSelectTrack(t);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{t.voiceName} Voice</span>
                        <span className="text-slate-500 font-mono">
                          {t.engine === 'gemini' ? 'Gemini TTS' : 'Browser'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">"{t.text}"</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Video Theme and Aspect Ratio */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <label className="text-sm font-semibold text-slate-200 block">
              2. Visual Theme &amp; Styling
            </label>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'cyber', label: 'Cyber Matrix', desc: 'Glowing neon audio grid' },
                { id: 'anime', label: 'Anime Aura', desc: 'Vibrant energy ring burst' },
                { id: 'studio', label: 'Studio Minimal', desc: 'Dark sleek glass soundwave' },
                { id: 'cinematic', label: 'Cinematic Noir', desc: 'High-contrast dramatic vignette' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    theme === t.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold block text-slate-200">{t.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* Aspect Ratio */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-400 block mb-2">Video Dimensions</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9 Landscape', sub: 'YouTube / Web' },
                  { id: '9:16', label: '9:16 Vertical', sub: 'TikTok / Shorts' },
                  { id: '1:1', label: '1:1 Square', sub: 'Instagram / Feed' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      aspectRatio === ratio.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold block text-slate-200">{ratio.id}</span>
                    <span className="text-[10px] text-slate-500 block">{ratio.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Captions Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Synchronized Animated Captions
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Displays live karaoke-style word subtitles
                </span>
              </div>
              <input
                type="checkbox"
                checked={showCaptions}
                onChange={(e) => setShowCaptions(e.target.checked)}
                className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartRender}
            disabled={isRendering || !currentTrack}
            className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
              isRendering || !currentTrack
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {isRendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Rendering Video ({renderProgress}%)...</span>
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                <span>Render Video File Now</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Preview & Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileVideo className="h-4 w-4 text-indigo-400" />
                <span>Video Player Output</span>
              </span>
              {renderedVideo && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Render Complete</span>
                </span>
              )}
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
              {renderedVideo ? (
                <video
                  src={renderedVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : isRendering ? (
                <div className="text-center p-6 space-y-3">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">
                    Composing Video Frames &amp; Audio Stream...
                  </p>
                  <div className="w-48 bg-slate-800 rounded-full h-2 mx-auto overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 transition-all duration-200"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400">{renderProgress}%</span>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Play className="h-6 w-6 ml-0.5" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">
                    {currentTrack
                      ? 'Ready to render video for selected voiceover'
                      : 'Generate audio in Voice Playground to preview video'}
                  </p>
                  <span className="text-[11px] text-slate-600 block">
                    Outputs high-definition WebM/MP4 with full audio sync
                  </span>
                </div>
              )}
            </div>

            {/* Rendered Video Actions & Specs */}
            {renderedVideo && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-slate-400 font-mono">
                  <span>Format: WebM / VP9</span>
                  <span>·</span>
                  <span>Duration: {renderedVideo.durationSeconds.toFixed(1)}s</span>
                  <span>·</span>
                  <span>Aspect: {aspectRatio}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadVideo}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Save Video (.webm)</span>
                  </button>
                  <button
                    onClick={() => setIsDriveModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
                  >
                    <Cloud className="h-3.5 w-3.5" />
                    <span>Upload to Drive</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg border border-rose-900/50 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      <DriveExportModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        fileBlob={renderedVideo?.videoBlob || null}
        fileName={`voxgemini_video_${Date.now()}.webm`}
        mimeType="video/webm"
        fileTypeLabel="WebM Video"
        description={`Video rendered from ${currentTrack?.voiceName || 'Gemini'} voiceover with animated waveforms and captions.`}
      />
    </div>
  );
};
