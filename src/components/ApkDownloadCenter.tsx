import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Shield,
  AlertCircle,
  HelpCircle,
  Cloud,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall.ts';
import { DriveExportModal } from './DriveExportModal.tsx';

export const ApkDownloadCenter: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [driveBlob, setDriveBlob] = useState<Blob | null>(null);

  // Direct Live App URLs
  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const devUrl =
    'https://ais-dev-dljyqrboostucdutzp3f6u-797744823751.asia-northeast1.run.app';
  const sharedUrl =
    'https://ais-pre-dljyqrboostucdutzp3f6u-797744823751.asia-northeast1.run.app';
  const targetUrl = currentOrigin || devUrl;

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // QR Code for direct mobile scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    targetUrl
  )}&bgcolor=020617&color=6366f1&qzone=1`;

  const handleDownloadManifest = () => {
    const a = document.createElement('a');
    a.href = '/manifest.json';
    a.download = 'manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAndroidManifest = () => {
    const a = document.createElement('a');
    a.href = '/AndroidManifest.xml';
    a.download = 'AndroidManifest.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner explaining why external websites showed URL not found */}
      <div className="p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20 text-xs text-indigo-300 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-100">
            Direct Android Installation Guide (Bina Kisi Third-Party Tool Ke)
          </p>
          <p className="text-slate-400 leading-relaxed">
            AI Studio preview URLs Google ke private secure network par host hote hain, isliye third-party websites (jaise PWABuilder) in tak nahi pahuch sakti aur "URL not found" dikhati hain. Lekin aapka Android phone aur Google Chrome ise{' '}
            <strong className="text-slate-200">directly aur bina kisi jhanjhat ke</strong> install kar sakta hai!
          </p>
        </div>
      </div>

      {/* Main Direct Android Install Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">
            Direct Mobile WebAPK
          </span>
          <h2 className="text-lg font-bold text-slate-100 mt-2 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo-400" />
            <span>Install VoxGemini on Android Directly</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Yeh link direct aapke Android phone ke Chrome browser me kholte hi phone par install ka button dikha deta hai. Chrome automatically iska official Android APK generate karke aapke phone me install kar deta hai.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {isInstallable ? (
            <button
              onClick={install}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Install Directly on This Device</span>
            </button>
          ) : isInstalled ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>App Already Installed on This Device</span>
            </div>
          ) : (
            <button
              onClick={() => handleCopyUrl(targetUrl)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedUrl ? 'Link Copied!' : 'Copy Direct Mobile Link'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Direct Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Open Directly on Phone */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-400">Step-by-Step</span>
            <span className="text-xs text-emerald-400 font-semibold">100% Working</span>
          </div>

          <h3 className="text-sm font-semibold text-slate-200">
            Mobile Chrome Me Kholkar 1-Click Install Karein
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">1.</span>
                <span>
                  Apne Android phone me <strong>Google Chrome</strong> open karein.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-indigo-400 font-bold">2.</span>
                <span>Neeche diya gaya URL paste karein aur Go dabayein:</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-indigo-300 break-all select-all">
                {targetUrl}
              </div>
              <div className="flex items-start gap-2 pt-1">
                <span className="font-mono text-indigo-400 font-bold">3.</span>
                <span>
                  Top bar par <strong>"Install App"</strong> par tap karein ya Chrome menu (⋮) me{' '}
                  <strong>"Install app"</strong> / <strong>"Add to Home screen"</strong> par click karein.
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCopyUrl(targetUrl)}
              className="flex-1 py-2 px-3 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedUrl ? 'Copied to Clipboard!' : 'Copy Direct Link'}</span>
            </button>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              Open Link
            </a>
          </div>
        </div>

        {/* Method 2: QR Code Instant Scan */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4 flex flex-col items-center text-center justify-between">
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-mono font-bold text-indigo-400">QR Code Scan</span>
              <span className="text-xs text-cyan-400 font-semibold">Instant Mobile Load</span>
            </div>

            <h3 className="text-sm font-semibold text-slate-200">
              Phone Camera Se Direct Scan Karein
            </h3>

            <p className="text-xs text-slate-400">
              Apne Android phone ka camera ya Google Lens is QR code par point kijiye, app turant phone me open ho jayegi.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 inline-block mx-auto">
              <img
                src={qrCodeUrl}
                alt="Scan to open on Android"
                className="w-40 h-40 rounded-lg"
                loading="lazy"
              />
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-500 truncate max-w-[280px]">
            {targetUrl}
          </p>
        </div>
      </div>

      {/* Direct Package Asset Downloads */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-400" />
          <span>Direct Android Package Files Download</span>
        </h3>
        <p className="text-xs text-slate-400">
          Agar aap Android Studio ya kisi compiler me manually APK build karna chahte hain, to direct package files download kar sakte hain:
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={handleDownloadAndroidManifest}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download AndroidManifest.xml</span>
          </button>

          <button
            onClick={handleDownloadManifest}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download manifest.json</span>
          </button>

          <button
            onClick={async () => {
              try {
                // Fetch AndroidManifest.xml and manifest.json to bundle
                const [manifestRes, androidRes] = await Promise.all([
                  fetch('/manifest.json').then((r) => r.text()),
                  fetch('/AndroidManifest.xml').then((r) => r.text()),
                ]);

                const packageData = {
                  appName: 'VoxGemini Voice & Video Studio',
                  version: '1.0.0',
                  packageType: 'Android WebAPK / Standalone Application',
                  publicDirectUrl: targetUrl,
                  exportedAt: new Date().toISOString(),
                  manifestJson: JSON.parse(manifestRes),
                  androidManifestXml: androidRes,
                  instructions: [
                    'Open the publicDirectUrl in Android Chrome to auto-generate and install the native Android APK.',
                    'Or use Android Studio to compile the included AndroidManifest.xml directly.',
                  ],
                };

                const blob = new Blob([JSON.stringify(packageData, null, 2)], {
                  type: 'application/json',
                });
                setDriveBlob(blob);
                setIsDriveModalOpen(true);
              } catch (err) {
                console.error('Failed to prepare package bundle for Drive:', err);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
          >
            <Cloud className="h-4 w-4" />
            <span>Save Package to Google Drive (Public Download)</span>
          </button>
        </div>
      </div>

      {/* Google Drive Dedicated Card */}
      <div className="p-5 rounded-xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/30 via-slate-900/70 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-100">
              Direct Google Drive Download (Public Access Enabled)
            </h4>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Aap is app ke pure Android setup aur files ko directly apne Google Drive par upload karke public direct download link prapt kar sakte hain, jisse koi bhi bina kisi jhanjhat ke download kar sake.
          </p>
        </div>

        <button
          onClick={async () => {
            try {
              const res = await fetch('/manifest.json');
              const text = await res.text();
              const bundle = {
                appName: 'VoxGemini Voice & Video Studio',
                directLiveUrl: targetUrl,
                androidManifest: '/AndroidManifest.xml',
                timestamp: Date.now(),
                webManifest: JSON.parse(text),
              };
              const blob = new Blob([JSON.stringify(bundle, null, 2)], {
                type: 'application/json',
              });
              setDriveBlob(blob);
              setIsDriveModalOpen(true);
            } catch (err) {
              console.error('Error preparing Drive upload:', err);
            }
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all whitespace-nowrap shrink-0"
        >
          <Globe className="h-4 w-4 text-emerald-400" />
          <span>Upload to Google Drive & Get Public Link</span>
        </button>
      </div>

      <DriveExportModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        fileBlob={driveBlob}
        fileName={`voxgemini_android_package_${Date.now()}.json`}
        mimeType="application/json"
        fileTypeLabel="Android Package Bundle"
        description="VoxGemini Voice Studio Android WebAPK Manifest and Configuration Bundle"
      />
    </div>
  );
};
