/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic2,
  Code,
  Key,
  History,
  Sparkles,
  Zap,
  Film,
  Bot,
  Wand2,
  Smartphone,
  Download,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { GeneratedTrack, CustomVoiceProfile } from './types/index.ts';
import { VoicePlayground } from './components/VoicePlayground.tsx';
import { VoiceDesignStudio } from './components/VoiceDesignStudio.tsx';
import { VideoGenerator } from './components/VideoGenerator.tsx';
import { AgentIntegrationHub } from './components/AgentIntegrationHub.tsx';
import { IntegrationHub } from './components/IntegrationHub.tsx';
import { ApiKeyGuide } from './components/ApiKeyGuide.tsx';
import { AudioLibrary } from './components/AudioLibrary.tsx';
import { ApkDownloadCenter } from './components/ApkDownloadCenter.tsx';
import { usePWAInstall } from './utils/usePWAInstall.ts';
import { initDriveAuth, googleSignIn, driveSignOut, auth } from './utils/googleDrive.ts';
import { User } from 'firebase/auth';

type NavigationTab =
  | 'playground'
  | 'design'
  | 'video'
  | 'apk'
  | 'agent'
  | 'integration'
  | 'api-key'
  | 'library';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('playground');
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [tracks, setTracks] = useState<GeneratedTrack[]>(() => {
    try {
      const saved = localStorage.getItem('voxgemini_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customVoices, setCustomVoices] = useState<CustomVoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem('voxgemini_custom_voices');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'voice_default_friend',
              name: 'My Friend Rahul',
              baseVoice: 'Puck',
              gender: 'Male',
              ageBracket: 'Mid-20s',
              accent: 'Indian English conversational',
              timbre: 'Warm, relaxed, friendly with casual chuckle cadence',
              energyLevel: 'Balanced',
              customPromptDescription:
                'Male Mid-20s speaker with a casual Indian English accent. Vocal timbre is warm and relaxed, chuckle cadence.',
              pitchOffset: 0,
              paceOffset: 1.0,
              createdAt: Date.now() - 3600000,
            },
          ];
    } catch {
      return [];
    }
  });

  const [activeTrack, setActiveTrack] = useState<GeneratedTrack | null>(null);
  const [driveUser, setDriveUser] = useState<User | null>(auth.currentUser);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('voxgemini_custom_key') || '';
    } catch {
      return '';
    }
  });

  // Track Drive auth state
  useEffect(() => {
    const unsub = initDriveAuth(
      (user) => setDriveUser(user),
      () => setDriveUser(null)
    );
    return () => unsub();
  }, []);

  // Persist tracks
  useEffect(() => {
    try {
      const toSave = tracks.slice(0, 20).map((t) => ({
        ...t,
        audioUrl: '',
      }));
      localStorage.setItem('voxgemini_tracks', JSON.stringify(toSave));
    } catch (err) {
      console.warn('Could not persist tracks to localStorage', err);
    }
  }, [tracks]);

  // Persist custom voices
  useEffect(() => {
    try {
      localStorage.setItem('voxgemini_custom_voices', JSON.stringify(customVoices));
    } catch (err) {
      console.warn('Could not persist custom voices', err);
    }
  }, [customVoices]);

  const handleSetCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    try {
      if (key) {
        localStorage.setItem('voxgemini_custom_key', key);
      } else {
        localStorage.removeItem('voxgemini_custom_key');
      }
    } catch (err) {
      console.warn('Could not persist key', err);
    }
  };

  const handleNewGeneratedTrack = (track: GeneratedTrack) => {
    setTracks((prev) => [track, ...prev]);
    setActiveTrack(track);
  };

  const handleSaveCustomVoice = (voice: CustomVoiceProfile) => {
    setCustomVoices((prev) => [voice, ...prev]);
  };

  const handleDeleteCustomVoice = (id: string) => {
    setCustomVoices((prev) => prev.filter((v) => v.id !== id));
  };

  const handleDeleteTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (activeTrack?.id === id) {
      setActiveTrack(null);
    }
  };

  const handleClearLibrary = () => {
    setTracks([]);
    setActiveTrack(null);
    try {
      localStorage.removeItem('voxgemini_tracks');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* 
        TOP BAR CONTRACT:
        [Brand title, one line] — [Nav links, single-line] — [1 primary action]
      */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-6 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('playground');
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Mic2 className="h-4 w-4" />
          </div>
          <span>VoxGemini Studio</span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('playground')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'playground'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            Playground
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
              activeTab === 'design'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            <span>Voice Design</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
              Custom
            </span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'video'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            Video Creator
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span>Android APK</span>
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'agent'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            Agent Hub
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'integration'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            SDKs
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'text-white border-b-2 border-indigo-500'
                : 'hover:text-slate-200'
            }`}
          >
            <span>Library</span>
            {tracks.length > 0 && (
              <span className="text-xs font-mono text-indigo-400 tabular-nums">
                ({tracks.length})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions (Google Drive + Install Button) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {driveUser ? (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-300 text-xs font-mono">
              <Cloud className="h-3.5 w-3.5 text-indigo-400" />
              <span className="truncate max-w-[120px]">{driveUser.displayName?.split(' ')[0] || 'Drive'}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Drive active with public sharing" />
            </div>
          ) : (
            <button
              onClick={async () => {
                try {
                  const res = await googleSignIn();
                  setDriveUser(res.user);
                } catch (err) {
                  console.error('Google sign-in error:', err);
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
              title="Sign in to save audio and video directly to Google Drive"
            >
              <Cloud className="h-3.5 w-3.5 text-indigo-400" />
              <span>Connect Drive</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Free Server Key Active</span>
          </div>

          {isInstallable ? (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
              title="Install VoxGemini on your device"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('apk')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-lg transition-all whitespace-nowrap shrink-0"
              title="Open Android APK Center"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Install on Android</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="xl:hidden flex items-center justify-around border-b border-slate-800 bg-slate-900/60 px-2 py-2 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('playground')}
          className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
            activeTab === 'playground' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Playground
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
            activeTab === 'design' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Voice Design
        </button>
        <button
          onClick={() => setActiveTab('apk')}
          className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'apk' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
          }`}
        >
          <Smartphone className="h-3 w-3" />
          <span>APK</span>
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
            activeTab === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Video
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
            activeTab === 'agent' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Agent
        </button>
        <button
          onClick={() => setActiveTab('integration')}
          className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
            activeTab === 'integration' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          SDKs
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'playground' && (
          <VoicePlayground
            onGeneratedTrack={handleNewGeneratedTrack}
            activeTrack={activeTrack}
            onSelectTrack={setActiveTrack}
            customApiKey={customApiKey}
          />
        )}

        {activeTab === 'design' && (
          <VoiceDesignStudio
            customVoices={customVoices}
            onSaveCustomVoice={handleSaveCustomVoice}
            onDeleteCustomVoice={handleDeleteCustomVoice}
            onNewTrackGenerated={handleNewGeneratedTrack}
            customApiKey={customApiKey}
          />
        )}

        {activeTab === 'video' && (
          <VideoGenerator
            tracks={tracks}
            activeTrack={activeTrack}
            onSelectTrack={setActiveTrack}
            customApiKey={customApiKey}
          />
        )}

        {activeTab === 'apk' && <ApkDownloadCenter />}

        {activeTab === 'agent' && <AgentIntegrationHub />}

        {activeTab === 'integration' && (
          <IntegrationHub
            currentText={activeTrack?.text}
            currentVoice={activeTrack?.voiceName}
            currentStyle={activeTrack?.style}
          />
        )}

        {activeTab === 'api-key' && (
          <ApiKeyGuide
            customApiKey={customApiKey}
            onSetCustomApiKey={handleSetCustomApiKey}
          />
        )}

        {activeTab === 'library' && (
          <AudioLibrary
            tracks={tracks}
            onSelectTrack={(t) => {
              setActiveTrack(t);
              setActiveTab('playground');
            }}
            onDeleteTrack={handleDeleteTrack}
            onClearLibrary={handleClearLibrary}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VoxGemini Studio</span>
            <span>·</span>
            <span>Built-in Free Google AI Voice &amp; Video Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('apk')}
              className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-emerald-400"
            >
              <Smartphone className="h-3 w-3" />
              <span>Android APK Install</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('design')}
              className="hover:text-slate-200 transition-colors"
            >
              Voice Designer
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('video')}
              className="hover:text-slate-200 transition-colors"
            >
              Video Creator
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
