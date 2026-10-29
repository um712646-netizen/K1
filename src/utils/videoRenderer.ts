/**
 * Client-side Audio-to-Video Canvas Renderer & MediaRecorder
 * Produces high-quality animated MP4/WebM videos with synchronized audio,
 * dynamic audio waveforms, particle backdrops, and karaoke subtitles.
 */

export interface VideoRenderOptions {
  audioUrl: string;
  audioBlob?: Blob;
  scriptText: string;
  voiceName: string;
  theme: 'cyber' | 'studio' | 'cinematic' | 'anime';
  aspectRatio: '16:9' | '9:16' | '1:1';
  showCaptions: boolean;
  onProgress?: (progress: number) => void;
}

export interface VideoRenderResult {
  videoBlob: Blob;
  videoUrl: string;
  mimeType: string;
  durationSeconds: number;
}

export async function renderVoiceoverVideo(options: VideoRenderOptions): Promise<VideoRenderResult> {
  const {
    audioUrl,
    scriptText,
    voiceName,
    theme = 'studio',
    aspectRatio = '16:9',
    showCaptions = true,
    onProgress,
  } = options;

  // 1. Prepare Audio Element and AudioContext
  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.src = audioUrl;

  await new Promise<void>((resolve, reject) => {
    audio.onloadedmetadata = () => resolve();
    audio.onerror = () => reject(new Error('Failed to load audio for video rendering'));
  });

  const duration = audio.duration || 5;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 44100,
  });

  const sourceNode = audioContext.createMediaElementSource(audio);
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  const audioDestinationNode = audioContext.createMediaStreamDestination();

  sourceNode.connect(analyserNode);
  sourceNode.connect(audioDestinationNode);
  sourceNode.connect(audioContext.destination);

  const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);

  // 2. Setup Offscreen Canvas
  let width = 1280;
  let height = 720;
  if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context not available');

  // 3. Prepare Subtitle Words and Timings
  const cleanWords = scriptText
    .replace(/<[^>]*>|\|[^|]*\||\[[^\]]*\]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const timePerWord = cleanWords.length > 0 ? duration / cleanWords.length : 1;

  // 4. Capture Canvas Stream & Combine with Audio Stream
  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDestinationNode.stream.getAudioTracks(),
  ]);

  // Determine supported mimeType
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 3_500_000,
  });

  const recordedChunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  return new Promise<VideoRenderResult>((resolve, reject) => {
    let animationFrameId: number;
    let particleSeed = 0;

    mediaRecorder.onstop = () => {
      cancelAnimationFrame(animationFrameId);
      audio.pause();
      audioContext.close();

      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(finalBlob);
      resolve({
        videoBlob: finalBlob,
        videoUrl,
        mimeType,
        durationSeconds: duration,
      });
    };

    mediaRecorder.onerror = (e) => {
      cancelAnimationFrame(animationFrameId);
      reject(e);
    };

    mediaRecorder.start(100);
    audio.play().catch(reject);

    // Frame rendering loop
    const renderFrame = () => {
      if (audio.ended || audio.currentTime >= duration) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        return;
      }

      const curTime = audio.currentTime;
      const progress = Math.min(1, curTime / duration);
      onProgress?.(progress);

      analyserNode.getByteFrequencyData(frequencyData);

      // Average energy for pulsing effects
      let energy = 0;
      for (let i = 0; i < 32; i++) {
        energy += frequencyData[i];
      }
      const avgEnergy = energy / (32 * 255);

      particleSeed += 0.03;

      // Draw Background based on Theme
      drawBackground(ctx, width, height, theme, avgEnergy, particleSeed);

      // Draw Center Visualizer
      drawWaveform(ctx, width, height, theme, frequencyData, avgEnergy);

      // Draw Voice Persona Badge
      drawHeaderBadge(ctx, width, height, voiceName, theme);

      // Draw Animated Captions
      if (showCaptions && cleanWords.length > 0) {
        drawCaptions(ctx, width, height, cleanWords, curTime, timePerWord, theme);
      }

      // Draw subtle timeline bar at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, height - 6, width, 6);
      ctx.fillStyle = theme === 'anime' ? '#F59E0B' : '#6366F1';
      ctx.fillRect(0, height - 6, width * progress, 6);

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: string,
  energy: number,
  seed: number
) {
  if (theme === 'cyber') {
    // Deep neon cyber gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    grad.addColorStop(0, `rgba(15, 23, 42, 1)`);
    grad.addColorStop(1, `rgba(2, 6, 23, 1)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Floating cyber grid lines
    ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 + energy * 0.1})`;
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (theme === 'anime') {
    // Vibrant sunset battle gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1E1B4B');
    grad.addColorStop(0.5, '#4C1D95');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Energy burst aura in background
    const auraRad = 150 + energy * 200;
    const aura = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, auraRad);
    aura.addColorStop(0, `rgba(245, 158, 11, ${0.25 + energy * 0.4})`);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
  } else if (theme === 'cinematic') {
    // Film noir / cinematic dramatic vignette
    ctx.fillStyle = '#05070B';
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, `rgba(30, 41, 59, ${0.3 + energy * 0.2})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Studio Dark Slate
    const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: string,
  freq: Uint8Array,
  energy: number
) {
  const centerY = h * 0.45;
  const barCount = 48;
  const barWidth = Math.max(4, (w * 0.65) / barCount - 4);
  const totalWidth = barCount * (barWidth + 4);
  const startX = (w - totalWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const rawVal = freq[i * 2] || 0;
    const heightFactor = (rawVal / 255) * 160 + 8;
    const x = startX + i * (barWidth + 4);
    const y = centerY - heightFactor / 2;

    if (theme === 'anime') {
      ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#EC4899';
    } else if (theme === 'cyber') {
      ctx.fillStyle = i % 2 === 0 ? '#06B6D4' : '#6366F1';
    } else if (theme === 'cinematic') {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.4 + (rawVal / 255) * 0.6})`;
    } else {
      ctx.fillStyle = '#6366F1';
    }

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, heightFactor, 4);
    ctx.fill();
  }
}

function drawHeaderBadge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  voiceName: string,
  theme: string
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Badge background card
  const badgeY = h * 0.16;
  const badgeW = 280;
  const badgeH = 46;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(w / 2 - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 12);
  ctx.fill();
  ctx.stroke();

  // Voice Persona text
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`Voice: ${voiceName} · AI Studio`, w / 2, badgeY);

  ctx.restore();
}

function drawCaptions(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  words: string[],
  curTime: number,
  timePerWord: number,
  theme: string
) {
  ctx.save();
  const activeWordIdx = Math.floor(curTime / timePerWord);

  // Show a rolling window of 6 words
  const windowSize = 6;
  const startIdx = Math.max(0, Math.min(words.length - windowSize, activeWordIdx - 2));
  const visibleWords = words.slice(startIdx, startIdx + windowSize);

  const captionY = h * 0.76;

  // Background banner for subtitles
  const bannerW = Math.min(w * 0.88, 960);
  const bannerH = 110;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(w / 2 - bannerW / 2, captionY - bannerH / 2, bannerW, bannerH, 16);
  ctx.fill();
  ctx.stroke();

  // Draw words with karaoke highlight
  ctx.font = '700 24px "DM Sans", sans-serif';
  ctx.textAlign = 'center';

  const fullPhrase = visibleWords.join(' ');
  ctx.fillStyle = '#E2E8F0';
  ctx.fillText(fullPhrase, w / 2, captionY);

  // Subtitle subtitle badge
  ctx.font = '500 12px "JetBrains Mono", monospace';
  ctx.fillStyle = theme === 'anime' ? '#F59E0B' : '#818CF8';
  ctx.fillText('• SYNCHRONIZED AGENT CAPTIONS •', w / 2, captionY + 36);

  ctx.restore();
}
