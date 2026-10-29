import React, { useState } from 'react';
import {
  History,
  Play,
  Download,
  Trash2,
  Sparkles,
  Zap,
  Clock,
  HardDrive,
  Smile,
  Cloud,
} from 'lucide-react';
import { GeneratedTrack } from '../types/index.ts';
import { formatByteSize, downloadAudioBlob, base64ToBlob } from '../utils/audioHelper.ts';
import { DriveExportModal } from './DriveExportModal.tsx';

interface AudioLibraryProps {
  tracks: GeneratedTrack[];
  onSelectTrack: (track: GeneratedTrack) => void;
  onDeleteTrack: (id: string) => void;
  onClearLibrary: () => void;
}

export const AudioLibrary: React.FC<AudioLibraryProps> = ({
  tracks,
  onSelectTrack,
  onDeleteTrack,
  onClearLibrary,
}) => {
  const [selectedForDrive, setSelectedForDrive] = useState<GeneratedTrack | null>(null);
  const [driveBlob, setDriveBlob] = useState<Blob | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);

  const handleDownload = (track: GeneratedTrack) => {
    if (!track.audioBase64) return;
    const blob = base64ToBlob(track.audioBase64, track.mimeType);
    const filename = `voxgemini_${track.voiceName.toLowerCase()}_${track.id}.wav`;
    downloadAudioBlob(blob, filename);
  };

  const handleDriveExport = async (track: GeneratedTrack) => {
    setSelectedForDrive(track);
    let blob: Blob | null = null;
    if (track.audioBase64) {
      blob = base64ToBlob(track.audioBase64, track.mimeType);
    } else if (track.audioUrl) {
      try {
        const res = await fetch(track.audioUrl);
        blob = await res.blob();
      } catch (err) {
        console.error('Failed to fetch audio for Drive:', err);
      }
    }
    if (blob) {
      setDriveBlob(blob);
      setIsDriveModalOpen(true);
    }
  };

  const totalBytes = tracks.reduce((sum, t) => sum + (t.byteSize || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-400" />
            <span>Generation History & Audio Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access, replay, and download all generated voice tracks from your session.
          </p>
        </div>

        {tracks.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              <span>{tracks.length} tracks</span>
              <span className="mx-1.5 text-slate-600">·</span>
              <span>{formatByteSize(totalBytes)}</span>
            </div>
            <button
              onClick={onClearLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/40 rounded-lg transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {tracks.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-slate-500 mb-3 border border-slate-800">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No Audio Generations Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Generate speech using Google Gemini 3.8 TTS with vocal bursts or the browser engine in the Playground to see your audio clips here.
          </p>
        </div>
      ) : (
        /* Track List Table / Grid */
        <div className="space-y-2">
          {tracks.map((track) => {
            const formattedDate = new Date(track.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={track.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                      track.engine === 'gemini'
                        ? track.hasExpressiveTags
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}
                  >
                    {track.engine === 'gemini' ? (
                      track.hasExpressiveTags ? (
                        <Smile className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm">
                        {track.voiceName} Voice
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">
                        {track.engine === 'gemini'
                          ? track.model || 'Gemini 3.8 Flash TTS'
                          : 'Browser Engine'}
                      </span>
                      {track.hasExpressiveTags && (
                        <>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Expressive Audio Tags
                          </span>
                        </>
                      )}
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs font-mono text-slate-500 tabular-nums">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-sans">
                      "{track.text}"
                    </p>

                    {track.style && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span>Style: {track.style}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="text-xs font-mono text-slate-500 tabular-nums mr-2">
                    {formatByteSize(track.byteSize)}
                  </span>

                  {track.audioUrl && (
                    <button
                      onClick={() => onSelectTrack(track)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 rounded-lg transition-colors"
                      title="Load and play in audio player"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                  )}

                  {track.audioBase64 && (
                    <button
                      onClick={() => handleDownload(track)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Download WAV file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDriveExport(track)}
                    className="p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/60 rounded-lg border border-indigo-900/40 transition-colors"
                    title="Save to Google Drive (Public Link)"
                  >
                    <Cloud className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteTrack(track.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete track"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DriveExportModal
        isOpen={isDriveModalOpen}
        onClose={() => {
          setIsDriveModalOpen(false);
          setSelectedForDrive(null);
        }}
        fileBlob={driveBlob}
        fileName={`voxgemini_${selectedForDrive?.voiceName?.toLowerCase() || 'speech'}_${Date.now()}.wav`}
        mimeType="audio/wav"
        fileTypeLabel="WAV Audio"
        description={`Voice generation: ${selectedForDrive?.text?.slice(0, 80) || ''}`}
      />
    </div>
  );
};
