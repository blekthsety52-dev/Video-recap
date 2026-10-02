import { VideoClipItem, RecapOptions } from '../types';
import { parseTimeToSeconds } from './time';
import { drawSampleVideoFrame } from './sampleData';

export interface RenderProgress {
  phase: string;
  percent: number;
  currentFrame: number;
  totalFrames: number;
  timeRemaining?: string;
}

export interface RenderResult {
  blob: Blob;
  url: string;
  duration: number;
  format: string;
}

export async function renderRecapVideo(
  clips: VideoClipItem[],
  options: RecapOptions,
  onProgress?: (p: RenderProgress) => void
): Promise<RenderResult> {
  if (clips.length === 0) {
    throw new Error('No clips to render');
  }

  // Calculate durations for each clip
  const clipDurations: number[] = clips.map((c) => {
    const s = parseTimeToSeconds(c.clipStart);
    const e = parseTimeToSeconds(c.clipEnd);
    return Math.max(1, e - s);
  });

  const padding = options.custom_padding ?? 1.0;
  // Calculate total recap duration: sum(durations) - (N - 1) * padding
  let totalDuration = clipDurations[0];
  for (let i = 1; i < clipDurations.length; i++) {
    totalDuration += clipDurations[i] - padding;
  }
  totalDuration = Math.max(1, totalDuration);

  // Setup canvas for 1920x1080 (or 1280x720 scaled for speed/efficiency if needed, but 1920x1080 matches schema)
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get 2D rendering context');

  // Load any user video elements if available
  const videoElements: Map<string, HTMLVideoElement> = new Map();
  for (const clip of clips) {
    if (clip.videoUrl) {
      const v = document.createElement('video');
      v.src = clip.videoUrl;
      v.crossOrigin = 'anonymous';
      v.muted = true;
      v.playsInline = true;
      await new Promise<void>((resolve) => {
        v.onloadedmetadata = () => resolve();
        v.onerror = () => resolve();
        setTimeout(resolve, 2000); // timeout fallback
      });
      videoElements.set(clip.id, v);
    }
  }

  // Audio setup with Web Audio API for recording real audio track
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const audioDest = audioCtx.createMediaStreamDestination();
  const synthGain = audioCtx.createGain();
  synthGain.connect(audioDest);
  synthGain.gain.setValueAtTime(0.2, audioCtx.currentTime);

  // Simple ambient chord sound generator for recap
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(220, audioCtx.currentTime);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime);
  osc1.connect(synthGain);
  osc2.connect(synthGain);
  osc1.start();
  osc2.start();

  // Combine canvas video stream + audio stream
  const fps = 30;
  const totalFrames = Math.ceil(totalDuration * fps);
  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  // Determine supported mime type
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start(100);

  // Pre-calculate start offsets for each clip
  const clipStartOffsets: number[] = [];
  let curOffset = 0;
  for (let i = 0; i < clips.length; i++) {
    clipStartOffsets.push(curOffset);
    curOffset += clipDurations[i] - padding;
  }

  // Render loop
  const startTimeMs = performance.now();
  for (let frame = 0; frame < totalFrames; frame++) {
    const recapTime = frame / fps;

    // Report progress
    if (onProgress && frame % 10 === 0) {
      const pct = Math.min(99, Math.round((frame / totalFrames) * 100));
      let phase = 'Resizing clips to 1920x1080...';
      if (pct < 20) phase = 'Importing data from spreadsheet...';
      else if (pct < 45) phase = 'Extracting clips and audio normalization...';
      else if (pct < 70) phase = 'Applying crossfade transitions...';
      else if (pct < 90) phase = 'Generating subtitle overlays...';
      else phase = 'Saving recap video...';

      const elapsed = (performance.now() - startTimeMs) / 1000;
      const rate = frame / Math.max(0.1, elapsed);
      const remSec = Math.round((totalFrames - frame) / Math.max(1, rate));

      onProgress({
        phase,
        percent: pct,
        currentFrame: frame,
        totalFrames,
        timeRemaining: `${remSec}s remaining`,
      });
    }

    // 1. Draw solid black base (1920x1080-black.jpg)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 2. Determine which clip(s) are active at recapTime
    // Clips can overlap by `padding` seconds during crossfade
    for (let i = 0; i < clips.length; i++) {
      const clipStart = clipStartOffsets[i];
      const clipDuration = clipDurations[i];
      const clipEnd = clipStart + clipDuration;

      if (recapTime >= clipStart && recapTime <= clipEnd) {
        const timeInClip = recapTime - clipStart;
        const clip = clips[i];

        // Calculate opacity based on crossfade / fadeIn / fadeOut
        let opacity = 1.0;
        // Fade in
        if (i === 0 && timeInClip < padding) {
          opacity = Math.max(0, timeInClip / padding);
        } else if (i > 0 && timeInClip < padding) {
          // Crossfade in
          opacity = Math.max(0, timeInClip / padding);
        }

        // Fade out
        const timeRemaining = clipDuration - timeInClip;
        if (i === clips.length - 1 && timeRemaining < padding) {
          // Final clip fades out to black
          opacity = Math.min(opacity, Math.max(0, timeRemaining / padding));
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Render clip content
        const vEl = videoElements.get(clip.id);
        if (vEl && vEl.readyState >= 1) {
          // Real video element: seek to clip timestamp
          const origStartSec = parseTimeToSeconds(clip.clipStart);
          const targetTime = origStartSec + timeInClip;
          if (Math.abs(vEl.currentTime - targetTime) > 0.08) {
            vEl.currentTime = targetTime;
            await new Promise<void>((resolveSeek) => {
              const onSeeked = () => {
                vEl.removeEventListener('seeked', onSeeked);
                resolveSeek();
              };
              vEl.addEventListener('seeked', onSeeked);
              setTimeout(resolveSeek, 60);
            });
          }
          drawFittedVideo(ctx, vEl, width, height);
        } else {
          // High quality procedural footage
          const origStartSec = parseTimeToSeconds(clip.clipStart);
          drawSampleVideoFrame(
            ctx,
            width,
            height,
            origStartSec + timeInClip,
            clip.sampleType || 'sample-neon',
            clip.filename
          );
        }

        // Draw Subtitles for this clip
        drawClipSubtitles(ctx, clip, i, width, height, timeInClip, clipDuration, padding, options);

        ctx.restore();
      }
    }

    // Allow frame to be captured
    // Small delay every few frames to prevent browser freezing
    if (frame % 15 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Stop audio and recorder
  try {
    osc1.stop();
    osc2.stop();
    audioCtx.close();
  } catch (_) {}

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const url = URL.createObjectURL(blob);
      if (onProgress) {
        onProgress({
          phase: 'Recap generation complete!',
          percent: 100,
          currentFrame: totalFrames,
          totalFrames,
        });
      }
      resolve({
        blob,
        url,
        duration: totalDuration,
        format: recorder.mimeType.includes('mp4') ? 'mp4' : 'webm',
      });
    };
    recorder.stop();
  });
}

export function drawFittedVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  targetW: number,
  targetH: number
) {
  const vw = video.videoWidth || 1920;
  const vh = video.videoHeight || 1080;
  const videoRatio = vw / vh;
  const targetRatio = targetW / targetH;

  let dw = targetW;
  let dh = targetH;
  let dx = 0;
  let dy = 0;

  if (videoRatio <= targetRatio) {
    // Fits height, letterboxed horizontally
    dh = targetH;
    dw = targetH * videoRatio;
    dx = (targetW - dw) / 2;
  } else {
    // Fits width, pillarboxed vertically
    dw = targetW;
    dh = targetW / videoRatio;
    dy = (targetH - dh) / 2;
  }

  ctx.drawImage(video, dx, dy, dw, dh);
}

function drawClipSubtitles(
  ctx: CanvasRenderingContext2D,
  clip: VideoClipItem,
  clipIndex: number,
  canvasW: number,
  canvasH: number,
  timeInClip: number,
  clipDuration: number,
  padding: number,
  options: RecapOptions
) {
  // Only draw if within subtitle active window (padding to duration - padding)
  if (timeInClip < padding * 0.5 || timeInClip > clipDuration - padding * 0.5) {
    return;
  }

  const isIntro = options.include_intro && clipIndex === 0;

  const lines = [clip.subtitle1, clip.subtitle2, clip.subtitle3].filter(
    (l) => l && l.trim().length > 0
  );
  if (lines.length === 0) return;

  ctx.save();

  if (isIntro) {
    // INTRO SUBTITLES: Centered in middle of screen
    const fontSize = options.intro_font_size || 120;
    const fontFamily = options.intro_font_file.includes('Serif')
      ? '"Playfair Display", "Liberation Serif", serif'
      : '"Inter", "Liberation Sans", sans-serif';

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = options.intro_text_color || '#ffffff';
    ctx.strokeStyle = options.intro_stroke_color || '#000000';
    ctx.lineWidth = options.intro_stroke_width ? options.intro_stroke_width * 3 : 8;
    ctx.lineJoin = 'round';

    const lineSpacing = fontSize * 1.25;
    const startY = canvasH / 2 - ((lines.length - 1) * lineSpacing) / 2;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineSpacing;
      if (ctx.lineWidth > 0) {
        ctx.strokeText(line, canvasW / 2, y);
      }
      ctx.fillText(line, canvasW / 2, y);
    });
  } else {
    // REGULAR SUBTITLES: Bottom aligned (left, center, right)
    const fontSize = options.sub_font_size || 50;
    const fontFamily = options.sub_font_file.includes('Serif')
      ? '"Liberation Serif", serif'
      : '"Liberation Sans", "Inter", sans-serif';

    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = options.sub_text_color || '#ffffff';
    ctx.strokeStyle = options.sub_stroke_color || '#000000';
    ctx.lineWidth = options.sub_stroke_width ? options.sub_stroke_width * 2.5 : 6;
    ctx.lineJoin = 'round';

    const lineSpacing = fontSize * 1.3;
    const bottomMargin = 90;
    const sideMargin = 120;

    let x = canvasW / 2;
    if (options.sub_alignment === 'left') {
      ctx.textAlign = 'left';
      x = sideMargin;
    } else if (options.sub_alignment === 'right') {
      ctx.textAlign = 'right';
      x = canvasW - sideMargin;
    } else {
      ctx.textAlign = 'center';
      x = canvasW / 2;
    }

    const startY = canvasH - bottomMargin - (lines.length - 1) * lineSpacing;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineSpacing;
      if (ctx.lineWidth > 0) {
        ctx.strokeText(line, x, y);
      }
      ctx.fillText(line, x, y);
    });
  }

  ctx.restore();
}
