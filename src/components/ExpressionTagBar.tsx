import React, { useState } from 'react';
import {
  Smile,
  Flame,
  VolumeX,
  MessageSquare,
  Sparkles,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExpressionTagBarProps {
  onInsertTag: (tag: string, isWrapTag?: boolean) => void;
}

interface TagItem {
  tag: string;
  label: string;
  description: string;
  isWrap?: boolean;
}

const VOCAL_BURSTS: TagItem[] = [
  { tag: '<laugh>', label: '<laugh>', description: 'Inserts natural spontaneous human laughter' },
  { tag: '<gasp>', label: '<gasp>', description: 'Inserts a sharp audible gasp of surprise or fright' },
  { tag: '<breath>', label: '<breath>', description: 'Natural breathing pause between phrases' },
  { tag: '<sigh>', label: '<sigh>', description: 'Soft exhalation of relief or weary emotion' },
  { tag: '<cough>', label: '<cough>', description: 'A slight cough or throat hesitation' },
  { tag: '<whisper>', label: '<whisper>...</whisper>', description: 'Wraps speech in an intimate whisper', isWrap: true },
];

const BACKCHANNELS: TagItem[] = [
  { tag: '|yeah|', label: '|yeah|', description: 'Conversational podcast agreement interjection' },
  { tag: '|mhm|', label: '|mhm|', description: 'Subtle thinking and listening murmur' },
  { tag: '|aha|', label: '|aha|', description: 'Moment of sudden discovery or clever insight' },
  { tag: '|oh|', label: '|oh|', description: 'Surprised comprehension or reaction' },
];

const EMOTIONAL_TAGS: TagItem[] = [
  { tag: '[excited]', label: '[excited]', description: 'High-energy, thrilled cadence' },
  { tag: '[cheerful]', label: '[cheerful]', description: 'Warm, positive, uplifting delivery' },
  { tag: '[dramatic]', label: '[dramatic]', description: 'Heavy, theatrical, suspenseful tone' },
  { tag: '[serious]', label: '[serious]', description: 'Solemn, focused, newsroom delivery' },
  { tag: '[whispering]', label: '[whispering]', description: 'Soft, secretive, hushed delivery' },
  { tag: '[sad]', label: '[sad]', description: 'Melancholic, slow, tender emotion' },
  { tag: '[angry]', label: '[angry]', description: 'Fierce, sharp, confrontational tone' },
];

const PACING_TAGS: TagItem[] = [
  { tag: '[pause: 500ms]', label: '[pause: 500ms]', description: 'Short half-second dramatic beat' },
  { tag: '[pause: 1s]', label: '[pause: 1s]', description: 'Full one-second silence beat' },
  { tag: '[slowly]', label: '[slowly]', description: 'Paced, deliberate phrasing' },
  { tag: '[fast]', label: '[fast]', description: 'Rapid, accelerated speech cadence' },
];

export const ExpressionTagBar: React.FC<ExpressionTagBarProps> = ({ onInsertTag }) => {
  const [activeCategory, setActiveCategory] = useState<'bursts' | 'backchannels' | 'emotions' | 'pacing'>('bursts');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  return (
    <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 space-y-2.5">
      {/* Category Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mr-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audio Tags:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveCategory('bursts')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'bursts'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Vocal Bursts (&lt;laugh&gt;, &lt;gasp&gt;)
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('emotions')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'emotions'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Emotions ([excited], [whisper])
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('backchannels')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'backchannels'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Conversational (|yeah|, |mhm|)
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('pacing')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'pacing'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Pacing &amp; Pauses
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>How tags work</span>
          {showGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Tag Buttons Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {activeCategory === 'bursts' &&
          VOCAL_BURSTS.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => onInsertTag(item.tag, item.isWrap)}
              title={item.description}
              className="px-2.5 py-1 text-xs font-mono font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded-md transition-all active:scale-95 whitespace-nowrap"
            >
              + {item.label}
            </button>
          ))}

        {activeCategory === 'emotions' &&
          EMOTIONAL_TAGS.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => onInsertTag(item.tag)}
              title={item.description}
              className="px-2.5 py-1 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-md transition-all active:scale-95 whitespace-nowrap"
            >
              + {item.label}
            </button>
          ))}

        {activeCategory === 'backchannels' &&
          BACKCHANNELS.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => onInsertTag(item.tag)}
              title={item.description}
              className="px-2.5 py-1 text-xs font-mono font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-md transition-all active:scale-95 whitespace-nowrap"
            >
              + {item.label}
            </button>
          ))}

        {activeCategory === 'pacing' &&
          PACING_TAGS.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => onInsertTag(item.tag)}
              title={item.description}
              className="px-2.5 py-1 text-xs font-mono font-medium text-violet-300 bg-violet-950/40 hover:bg-violet-900/60 border border-violet-800/50 rounded-md transition-all active:scale-95 whitespace-nowrap"
            >
              + {item.label}
            </button>
          ))}
      </div>

      {/* Explanatory Collapsible Guide */}
      {showGuide && (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5 mt-2">
          <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
            <span>Google Gemini Expressive Speech Engine Guide</span>
          </p>
          <p className="text-slate-400">
            Inserting tags like <span className="text-amber-300 font-mono">&lt;laugh&gt;</span>,{' '}
            <span className="text-amber-300 font-mono">&lt;gasp&gt;</span>, or{' '}
            <span className="text-cyan-300 font-mono">|yeah|</span> automatically switches the model to{' '}
            <span className="text-indigo-300 font-mono">gemini-3.8-flash-tts</span>. The model renders true
            non-verbal human vocalizations (authentic chuckles, intake of breath, realistic whispers) instead of
            just reading the words aloud.
          </p>
        </div>
      )}
    </div>
  );
};
