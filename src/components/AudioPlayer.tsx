import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  FastForward,
  Rewind,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { formatDuration, formatByteSize } from '../utils/audioHelper.ts';
import { DriveExportModal } from './DriveExportModal.tsx';

interface AudioPlayerProps {
  audioUrl: string;
  voiceName: string;
  engine: 'gemini' | 'browser';
  stylePrompt?: string;
  latencyMs?: number;
  byteSize?: number;
  onDownload?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  voiceName,
  engine,
  stylePrompt,
  latencyMs,
  byteSize,
  onDownload,
  autoPlay = true,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [driveBlob, setDriveBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  // Generate realistic waveform bars based on audio url
  useEffect(() => {
    // Generate pseudo-random deterministic waveform profile for visualization
    const bars: number[] = [];
    const seed = audioUrl.length + voiceName.charCodeAt(0);
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI;
      const base = Math.sin(angle) * 0.7;
      const variation = Math.sin((i * seed) / 10) * 0.25;
      const val = Math.min(1, Math.max(0.12, base + variation));
      bars.push(val);
    }
    setWaveformBars(bars);
  }, [audioUrl, voiceName]);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (autoPlay) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, autoPlay]);

  // Canvas waveform rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformBars.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barWidth = 3;
    const gap = (width - waveformBars.length * barWidth) / (waveformBars.length - 1);
    const progressPercent = duration > 0 ? currentTime / duration : 0;

    waveformBars.forEach((barHeightFraction, index) => {
      const x = index * (barWidth + gap);
      const barProgress = index / waveformBars.length;
      const isPast = barProgress <= progressPercent;

      // Animate active bars slightly if playing
      let adjustedFraction = barHeightFraction;
      if (isPlaying && Math.abs(barProgress - progressPercent) < 0.08) {
        adjustedFraction = Math.min(1, barHeightFraction * 1.3);
      }

      const h = Math.max(4, adjustedFraction * (height - 8));
      const y = (height - h) / 2;

      ctx.fillStyle = isPast ? '#6366F1' : '#334155';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, 2);
      ctx.fill();
    });
  }, [waveformBars, currentTime, duration, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100">{voiceName} Voice</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">
                {engine === 'gemini' ? 'Gemini 3.8 Flash Lite' : 'Browser Web Speech'}
              </span>
            </div>
            {stylePrompt && (
              <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                Style: {stylePrompt}
              </p>
            )}
          </div>
        </div>

        {/* Technical Audio Metadata */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 tabular-nums">
          {byteSize !== undefined && (
            <span>{formatByteSize(byteSize)}</span>
          )}
          {latencyMs !== undefined && (
            <>
              <span className="text-slate-600">·</span>
              <span>{latencyMs}ms latency</span>
            </>
          )}
          <span className="text-slate-600">·</span>
          <span className="text-indigo-400">24kHz WAV</span>
        </div>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={720}
          height={68}
          onClick={handleSeek}
          className="h-16 w-full cursor-pointer rounded-lg bg-slate-950/70 hover:bg-slate-950 transition-colors"
          title="Click to seek playback position"
        />
        {/* Playback time labels */}
        <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSkip(-5)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Rewind 5 seconds"
          >
            <Rewind className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Forward 5 seconds"
          >
            <FastForward className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Replay from start"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                playbackRate === rate
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume & Download Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={toggleMute}
              className="hover:text-slate-200 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-18 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
              title="Download generated WAV file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download WAV</span>
            </button>
          )}

          {audioUrl && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(audioUrl);
                  const blob = await res.blob();
                  setDriveBlob(blob);
                  setIsDriveModalOpen(true);
                } catch (err) {
                  console.error('Failed to prepare audio blob for Drive:', err);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 rounded-lg border border-indigo-700/60 transition-colors whitespace-nowrap shrink-0"
              title="Save directly to Google Drive with public sharing link"
            >
              <Cloud className="h-3.5 w-3.5 text-indigo-400" />
              <span>Save to Drive</span>
            </button>
          )}
        </div>
      </div>

      <DriveExportModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        fileBlob={driveBlob}
        fileName={`voxgemini_${voiceName.toLowerCase()}_${Date.now()}.wav`}
        mimeType="audio/wav"
        fileTypeLabel="WAV Audio"
        description={`Voiceover generated with ${voiceName} (${engine} engine)`}
      />
    </div>
  );
};
