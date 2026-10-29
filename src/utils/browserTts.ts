export interface BrowserSpeechOptions {
  text: string;
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isBrowserSpeechSupported()) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Chrome/Safari asynchronously populate voices
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    // Timeout fallback after 1.5s
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 1500);
  });
}

export function speakBrowserSpeech(options: BrowserSpeechOptions): SpeechSynthesisUtterance | null {
  if (!isBrowserSpeechSupported()) {
    options.onError?.(new Error('Browser Web Speech API is not supported in this browser.'));
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  if (options.voiceURI) {
    const allVoices = window.speechSynthesis.getVoices();
    const matchedVoice = allVoices.find((v) => v.voiceURI === options.voiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    // Interrupted is normal when user cancels or triggers new speech
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      options.onError?.(e);
    } else {
      options.onEnd?.();
    }
  };

  if (options.onBoundary) {
    utterance.onboundary = options.onBoundary;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopBrowserSpeech(): void {
  if (isBrowserSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
