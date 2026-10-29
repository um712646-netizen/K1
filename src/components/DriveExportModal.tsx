import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  X,
  Share2,
  ShieldCheck,
  Lock,
  Globe,
  FileAudio,
  FileVideo,
  FileCode,
} from 'lucide-react';
import {
  uploadToGoogleDrive,
  googleSignIn,
  driveSignOut,
  initDriveAuth,
  DriveUploadResult,
  auth,
} from '../utils/googleDrive.ts';
import { User } from 'firebase/auth';

interface DriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileBlob: Blob | null;
  fileName: string;
  mimeType: string;
  fileTypeLabel?: string;
  description?: string;
}

export const DriveExportModal: React.FC<DriveExportModalProps> = ({
  isOpen,
  onClose,
  fileBlob,
  fileName,
  mimeType,
  fileTypeLabel = 'File',
  description,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUploadResult(null);
      setErrorMessage(null);
      setCopiedLink(null);
    }
  }, [isOpen, fileName]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      setCurrentUser(res.user);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await driveSignOut();
    setCurrentUser(null);
  };

  const handleConfirmUpload = async () => {
    if (!fileBlob) {
      setErrorMessage('No file data available to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const result = await uploadToGoogleDrive({
        fileBlob,
        fileName,
        mimeType,
        description: description || `Created with VoxGemini Studio: ${fileName}`,
        makePublic,
      });

      setUploadResult(result);
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload to Google Drive. Please check permissions.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (text: string, type: 'view' | 'direct') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const getFileIcon = () => {
    if (mimeType.includes('audio')) return <FileAudio className="h-6 w-6 text-indigo-400" />;
    if (mimeType.includes('video')) return <FileVideo className="h-6 w-6 text-emerald-400" />;
    return <FileCode className="h-6 w-6 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Save to Google Drive</span>
                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Public Direct Link
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload directly to your Drive with open public downloading enabled.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* State 1: Upload Completed Successfully */}
        {uploadResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Uploaded Successfully to Google Drive!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                File <strong className="text-white font-mono">{uploadResult.name}</strong> is now saved on your Google Drive. Public access has been configured so anyone can view or download it directly.
              </p>
            </div>

            {/* Links and Shareable Controls */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Public Direct Download Link</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={uploadResult.directDownloadUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(uploadResult.directDownloadUrl, 'direct')}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0 shadow-sm"
                  >
                    {copiedLink === 'direct' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Google Drive Preview Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={uploadResult.webViewLink}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono select-all focus:outline-none"
                  />
                  <a
                    href={uploadResult.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Drive</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Confirmation & Sign-in */
          <div className="space-y-4">
            {/* File Details Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                {getFileIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 truncate">{fileName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {fileTypeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  MIME: {mimeType}
                </p>
              </div>
            </div>

            {/* Authentication Check */}
            {!currentUser ? (
              <div className="space-y-3 p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20 text-center">
                <p className="text-xs text-indigo-200 font-medium">
                  Connect your Google Account to upload to your personal Google Drive
                </p>
                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="gsi-material-button inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-lg bg-white text-slate-900 font-medium text-xs hover:bg-slate-100 transition-all shadow-md disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="h-7 w-7 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="leading-tight">
                    <p className="font-medium text-slate-200">
                      {currentUser.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-slate-200 text-[11px] underline"
                >
                  Switch
                </button>
              </div>
            )}

            {/* Public Access Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={makePublic}
                  onChange={(e) => setMakePublic(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-medium text-slate-200 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Public Access Allowed (Anyone with link can download)</span>
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Automatically sets Google Drive permissions so anyone you share the link with can play or download directly without needing to sign in.
                  </p>
                </div>
              </label>
            </div>

            {/* Explicit Confirmation Notice as required by Workspace Skills */}
            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Clicking <strong>Upload to Google Drive</strong> will create this new file in your personal Google Drive storage using your granted permissions.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading || !fileBlob}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading to Drive...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-3.5 w-3.5" />
                    <span>Upload to Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
