import React, { useState } from 'react';
import {
  Key,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Info,
  Copy,
  Check,
} from 'lucide-react';

interface ApiKeyGuideProps {
  customApiKey: string;
  onSetCustomApiKey: (key: string) => void;
}

export const ApiKeyGuide: React.FC<ApiKeyGuideProps> = ({
  customApiKey,
  onSetCustomApiKey,
}) => {
  const [inputKey, setInputKey] = useState<string>(customApiKey);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    latencyMs?: number;
    message: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleValidate = async () => {
    if (!inputKey.trim()) {
      setValidationResult({
        valid: false,
        message: 'Please enter an API key to test.',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/tts/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setValidationResult({
          valid: true,
          latencyMs: data.latencyMs,
          message: data.message || 'Key verified! Authorized for Gemini Speech generation.',
        });
        onSetCustomApiKey(inputKey.trim());
      } else {
        setValidationResult({
          valid: false,
          message: data.error || 'Failed to validate key. Ensure the key has Gemini API access enabled.',
        });
      }
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: err.message || 'Network error during validation.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const copyStudioUrl = () => {
    navigator.clipboard.writeText('https://aistudio.google.com/apikey');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              <span>How to Get Your Free Google AI Studio API Key</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Google provides a completely free tier for AI Studio with no credit card required.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <span>Get Free API Key on Google AI Studio</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* 4-Step Interactive Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            step: '01',
            title: 'Visit AI Studio',
            desc: 'Navigate to aistudio.google.com/apikey in your browser.',
            action: (
              <button
                onClick={copyStudioUrl}
                className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied link!' : 'Copy direct link'}</span>
              </button>
            ),
          },
          {
            step: '02',
            title: 'Sign In with Google',
            desc: 'Use any personal or workspace Google Account. Zero credit card or billing details required.',
            action: <span className="mt-3 text-xs text-emerald-400 font-medium block">No credit card needed</span>,
          },
          {
            step: '03',
            title: 'Create Free Key',
            desc: 'Click "Create API key in new project". A private key string beginning with AIzaSy... will generate.',
            action: <span className="mt-3 text-xs text-slate-400 block font-mono">AIzaSy...</span>,
          },
          {
            step: '04',
            title: 'Connect & Build',
            desc: 'Paste your key into the validator below or set GEMINI_API_KEY in your app environment.',
            action: <span className="mt-3 text-xs text-indigo-400 font-medium block">Ready for integration</span>,
          },
        ].map((item) => (
          <div key={item.step} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
            <span className="text-xs font-mono font-bold text-indigo-400 block">{item.step}.</span>
            <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            {item.action}
          </div>
        ))}
      </div>

      {/* Free Tier Quotas & Unlimited Strategy Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span>Free Tier Quotas & 100% Unlimited Strategy</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Free Tier Card */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-sm">Google AI Studio Free Tier</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-xs">
                Free Tier
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>15 Requests Per Minute (RPM) free</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>1,500 Requests Per Day (RPD) free</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>1,000,000 Tokens Per Day</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>All 5 Gemini TTS voices included (Kore, Puck, Charon, Fenrir, Zephyr)</span>
              </li>
            </ul>
          </div>

          {/* Unlimited Fallback Strategy */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-sm">Unlimited Browser Speech Engine</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-xs">
                Unlimited
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Infinite runs — 0 rate limits, 0 quotas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Works offline with zero internet or cloud dependencies</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Zero server cost or subscription fee</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Seamless hybrid failover: call Gemini first, fallback to browser</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Live Key Validator & Latency Prober */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Live API Key Validator & Latency Prober</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Test any Google AI Studio key against the live Gemini 3.8 Flash Lite TTS endpoint to verify status and measure latency.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AIzaSy..."
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <button
            onClick={handleValidate}
            disabled={isValidating || !inputKey.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-all shrink-0"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Testing Key...</span>
              </>
            ) : (
              <span>Verify & Connect Key</span>
            )}
          </button>
        </div>

        {/* Validation Output */}
        {validationResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              validationResult.valid
                ? 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-800/50 bg-rose-950/20 text-rose-300'
            }`}
          >
            {validationResult.valid ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {validationResult.valid ? 'Verification Successful' : 'Validation Failed'}
                </span>
                {validationResult.latencyMs !== undefined && (
                  <span className="font-mono tabular-nums text-slate-400">
                    · {validationResult.latencyMs}ms roundtrip
                  </span>
                )}
              </div>
              <p className="mt-0.5 opacity-90">{validationResult.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
