import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Layers,
  Video,
  CheckCircle,
} from 'lucide-react';
import { VideoClipItem, RecapOptions } from '../types';
import { parseTimeToSeconds, formatSecondsToTime } from '../utils/time';
import { drawSampleVideoFrame } from '../utils/sampleData';
import { drawFittedVideo } from '../utils/videoRenderer';

interface VideoPlayerProps {
  clips: VideoClipItem[];
  options: RecapOptions;
  currentClipIndex: number;
  setCurrentClipIndex: (idx: number) => void;
  onGenerateRecap?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  clips,
  options,
  currentClipIndex,
  setCurrentClipIndex,
  onGenerateRecap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recapTime, setRecapTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'timeline' | 'solo'>('timeline');

  // Video element pool for uploaded video files
  const videoPoolRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Audio nodes for live preview
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const padding = options.custom_padding ?? 1.0;

  // Initialize and synchronize HTMLVideoElement for any clip with videoUrl
  useEffect(() => {
    const pool = videoPoolRef.current;
    clips.forEach((clip) => {
      if (clip.videoUrl) {
        let v = pool.get(clip.id);
        if (!v || v.src !== clip.videoUrl) {
          if (v) {
            v.pause();
            v.src = '';
          }
          v = document.createElement('video');
          v.src = clip.videoUrl;
          v.crossOrigin = 'anonymous';
          v.muted = isMuted;
          v.playsInline = true;
          v.preload = 'auto';
          pool.set(clip.id, v);
        }
      }
    });

    // Cleanup clips removed from list
    const currentIds = new Set(clips.map((c) => c.id));
    pool.forEach((v, id) => {
      if (!currentIds.has(id)) {
        v.pause();
        v.src = '';
        pool.delete(id);
      }
    });
  }, [clips, isMuted]);

  // Pause real videos when isPlaying becomes false
  useEffect(() => {
    if (!isPlaying) {
      videoPoolRef.current.forEach((v) => {
        if (!v.paused) v.pause();
      });
    }
  }, [isPlaying]);

  // Calculate durations for each clip
  const clipDurations = useMemo(() => {
    return clips.map((c) => {
      const s = parseTimeToSeconds(c.clipStart);
      const e = parseTimeToSeconds(c.clipEnd);
      return Math.max(1, e - s);
    });
  }, [clips]);

  // Compute total duration: sum(clipDurations) - (N - 1) * padding
  const totalDuration = useMemo(() => {
    if (clipDurations.length === 0) return 0;
    let sum = clipDurations[0];
    for (let i = 1; i < clipDurations.length; i++) {
      sum += clipDurations[i] - padding;
    }
    return Math.max(1, sum);
  }, [clipDurations, padding]);

  // Start offsets for each clip in the recap timeline
  const clipStartOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cur = 0;
    for (let i = 0; i < clips.length; i++) {
      offsets.push(cur);
      cur += clipDurations[i] - padding;
    }
    return offsets;
  }, [clips, clipDurations, padding]);

  // Synthetic Audio start/stop on playback (active when current clip is sample footage)
  useEffect(() => {
    const currentClip = clips[currentClipIndex];
    const isUsingUploadedVideo = currentClip?.videoUrl;

    if (isPlaying && !isMuted && !isUsingUploadedVideo) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        const actx = audioCtxRef.current;
        const g = actx.createGain();
        g.gain.setValueAtTime(0.08, actx.currentTime);
        g.connect(actx.destination);
        gainNodeRef.current = g;

        const o1 = actx.createOscillator();
        const o2 = actx.createOscillator();
        o1.type = 'triangle';
        o2.type = 'sine';
        o1.frequency.setValueAtTime(220, actx.currentTime);
        o2.frequency.setValueAtTime(329.63, actx.currentTime);
        o1.connect(g);
        o2.connect(g);
        o1.start();
        o2.start();

        osc1Ref.current = o1;
        osc2Ref.current = o2;
      } catch (_) {}
    } else {
      try {
        osc1Ref.current?.stop();
        osc2Ref.current?.stop();
        osc1Ref.current?.disconnect();
        osc2Ref.current?.disconnect();
        gainNodeRef.current?.disconnect();
      } catch (_) {}
      osc1Ref.current = null;
      osc2Ref.current = null;
      gainNodeRef.current = null;
    }

    return () => {
      try {
        osc1Ref.current?.stop();
        osc2Ref.current?.stop();
      } catch (_) {}
    };
  }, [isPlaying, isMuted, currentClipIndex, clips]);

  // Playback timer loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setRecapTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDuration]);

  // Update current clip index based on recap time
  useEffect(() => {
    for (let i = 0; i < clips.length; i++) {
      const start = clipStartOffsets[i];
      const duration = clipDurations[i];
      if (recapTime >= start && recapTime < start + duration) {
        if (currentClipIndex !== i) {
          setCurrentClipIndex(i);
        }
        break;
      }
    }
  }, [recapTime, clipStartOffsets, clipDurations, clips.length, currentClipIndex, setCurrentClipIndex]);

  // Render composite frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || clips.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Black background (1920x1080-black.jpg)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 2. Composite active clip(s) with crossfade
    for (let i = 0; i < clips.length; i++) {
      const clipStart = clipStartOffsets[i];
      const clipDuration = clipDurations[i];
      const clipEnd = clipStart + clipDuration;

      if (recapTime >= clipStart && recapTime <= clipEnd) {
        const timeInClip = recapTime - clipStart;
        const clip = clips[i];

        // Opacity transition
        let opacity = 1.0;
        if (i === 0 && timeInClip < padding) {
          opacity = Math.max(0, timeInClip / padding);
        } else if (i > 0 && timeInClip < padding) {
          opacity = Math.max(0, timeInClip / padding);
        }

        const timeRemaining = clipDuration - timeInClip;
        if (i === clips.length - 1 && timeRemaining < padding) {
          opacity = Math.min(opacity, Math.max(0, timeRemaining / padding));
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Render footage: If real uploaded video is available, draw real video!
        const vEl = videoPoolRef.current.get(clip.id);
        if (vEl && vEl.readyState >= 1) {
          const origStartSec = parseTimeToSeconds(clip.clipStart);
          const targetTime = origStartSec + timeInClip;
          if (Math.abs(vEl.currentTime - targetTime) > 0.25) {
            vEl.currentTime = targetTime;
          }
          if (isPlaying && vEl.paused) {
            vEl.play().catch(() => {});
          } else if (!isPlaying && !vEl.paused) {
            vEl.pause();
          }
          drawFittedVideo(ctx, vEl, width, height);
        } else {
          // Draw procedural / sample footage
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

        // Draw Subtitles
        const isIntro = options.include_intro && i === 0;
        const lines = [clip.subtitle1, clip.subtitle2, clip.subtitle3].filter(
          (l) => l && l.trim().length > 0
        );

        if (lines.length > 0) {
          if (isIntro) {
            // Centered intro subtitle
            const fontSize = Math.round(options.intro_font_size * 0.7);
            const fontFamily = options.intro_font_file.includes('Serif')
              ? '"Playfair Display", serif'
              : '"Inter", sans-serif';

            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = options.intro_text_color || '#ffffff';
            ctx.strokeStyle = options.intro_stroke_color || '#000000';
            ctx.lineWidth = (options.intro_stroke_width || 3) * 2;
            ctx.lineJoin = 'round';

            const lineSpacing = fontSize * 1.25;
            const startY = height / 2 - ((lines.length - 1) * lineSpacing) / 2;

            lines.forEach((line, idx) => {
              const y = startY + idx * lineSpacing;
              if (ctx.lineWidth > 0) ctx.strokeText(line, width / 2, y);
              ctx.fillText(line, width / 2, y);
            });
          } else {
            // Bottom-aligned clip subtitles
            const fontSize = Math.round(options.sub_font_size * 0.7);
            const fontFamily = options.sub_font_file.includes('Serif')
              ? '"Liberation Serif", serif'
              : '"Liberation Sans", sans-serif';

            ctx.font = `600 ${fontSize}px ${fontFamily}`;
            ctx.fillStyle = options.sub_text_color || '#ffffff';
            ctx.strokeStyle = options.sub_stroke_color || '#000000';
            ctx.lineWidth = (options.sub_stroke_width || 3) * 2;
            ctx.lineJoin = 'round';

            const lineSpacing = fontSize * 1.3;
            const bottomMargin = 70;
            const sideMargin = 90;

            let x = width / 2;
            if (options.sub_alignment === 'left') {
              ctx.textAlign = 'left';
              x = sideMargin;
            } else if (options.sub_alignment === 'right') {
              ctx.textAlign = 'right';
              x = width - sideMargin;
            } else {
              ctx.textAlign = 'center';
              x = width / 2;
            }

            const startY = height - bottomMargin - (lines.length - 1) * lineSpacing;

            lines.forEach((line, idx) => {
              const y = startY + idx * lineSpacing;
              if (ctx.lineWidth > 0) ctx.strokeText(line, x, y);
              ctx.fillText(line, x, y);
            });
          }
        }

        ctx.restore();
      }
    }
  }, [
    recapTime,
    isPlaying,
    clips,
    clipStartOffsets,
    clipDurations,
    options,
    padding,
  ]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setRecapTime(val);

    // Sync any uploaded video element currentTime directly
    clips.forEach((c, i) => {
      const s = clipStartOffsets[i];
      const dur = clipDurations[i];
      if (val >= s && val <= s + dur) {
        const vEl = videoPoolRef.current.get(c.id);
        if (vEl) {
          vEl.currentTime = parseTimeToSeconds(c.clipStart) + (val - s);
        }
      }
    });
  };

  const handleJumpToClip = (index: number) => {
    if (index >= 0 && index < clips.length) {
      const targetTime = clipStartOffsets[index] || 0;
      setRecapTime(targetTime);
      setCurrentClipIndex(index);

      const clip = clips[index];
      const vEl = videoPoolRef.current.get(clip.id);
      if (vEl) {
        vEl.currentTime = parseTimeToSeconds(clip.clipStart);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentClip = clips[currentClipIndex];
  const isCurrentUploaded = !!currentClip?.videoUrl;

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
    >
      {/* Top Bar Info */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">1080p Master Preview</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">
            Clip {currentClipIndex + 1} of {clips.length}:{' '}
            <strong className="text-slate-200">{currentClip?.filename || 'No clips'}</strong>
          </span>
          {isCurrentUploaded ? (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Playing Uploaded Video</span>
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Sample Footage
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Crossfade: {options.custom_padding}s</span>
          </div>
          <div className="font-mono text-indigo-300 font-semibold">
            {formatSecondsToTime(recapTime, false)} / {formatSecondsToTime(totalDuration, false)}
          </div>
        </div>
      </div>

      {/* 16:9 Canvas Player */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-contain pointer-events-none select-none"
        />

        {/* Center Play Overlay when paused */}
        {!isPlaying && (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 transition transform hover:scale-110 active:scale-95 z-20"
          >
            <Play className="w-7 h-7 fill-current translate-x-0.5" />
          </button>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-white/10">
            {options.include_intro && currentClipIndex === 0
              ? 'Intro Mode (Centered)'
              : `Sub Alignment: ${options.sub_alignment}`}
          </div>
          {isCurrentUploaded && (
            <div className="bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Video className="w-3 h-3 text-emerald-400" />
              <span>Real Video Source Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Multi-Clip Timeline Track */}
      <div className="px-4 pt-3 pb-1 bg-slate-950/80">
        <div className="relative w-full h-7 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex cursor-pointer">
          {clips.map((c, i) => {
            const start = clipStartOffsets[i];
            const dur = clipDurations[i];
            const widthPct = (dur / totalDuration) * 100;
            const isCurrent = currentClipIndex === i;

            return (
              <div
                key={c.id}
                onClick={() => handleJumpToClip(i)}
                style={{ width: `${widthPct}%` }}
                className={`h-full relative border-r border-slate-950/60 px-2 flex items-center justify-between text-[10px] font-medium transition select-none ${
                  isCurrent
                    ? 'bg-indigo-600/30 text-indigo-200 border-b-2 border-b-indigo-400 font-semibold'
                    : 'bg-slate-800/40 hover:bg-slate-800/70 text-slate-400'
                }`}
                title={`Clip ${i + 1}: ${c.filename} (${formatSecondsToTime(dur, false)})${c.videoUrl ? ' [Uploaded Video]' : ''}`}
              >
                <div className="flex items-center gap-1 truncate">
                  {c.videoUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  <span className="truncate">{c.filename.replace(/\.[^/.]+$/, '')}</span>
                </div>
                <span className="text-[9px] font-mono opacity-60">#{i + 1}</span>

                {/* Crossfade indicator zone at end of clip if not last */}
                {i < clips.length - 1 && (
                  <div
                    style={{ width: `${(padding / dur) * 100}%` }}
                    className="absolute right-0 top-0 bottom-0 bg-amber-500/20 border-l border-amber-500/40 pointer-events-none"
                    title={`Crossfade overlap (${padding}s)`}
                  />
                )}
              </div>
            );
          })}

          {/* Scrubber Playhead Line */}
          <div
            style={{ left: `${(recapTime / totalDuration) * 100}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] pointer-events-none z-10"
          >
            <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-cyan-400 -mt-0.5" />
          </div>
        </div>

        {/* Range Slider for scrubbing */}
        <input
          type="range"
          min={0}
          max={totalDuration}
          step={0.05}
          value={recapTime}
          onChange={handleSeek}
          className="w-full h-2 mt-1 accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Player Controls Bar */}
      <div className="px-4 py-3 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleJumpToClip(Math.max(0, currentClipIndex - 1))}
            disabled={currentClipIndex === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
            title="Previous Clip"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={() => handleJumpToClip(Math.min(clips.length - 1, currentClipIndex + 1))}
            disabled={currentClipIndex === clips.length - 1}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition"
            title="Next Clip"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setRecapTime(0);
              setCurrentClipIndex(0);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Restart Recap"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Quick stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {options.clip_selection_method.toUpperCase()} Mode ({options.clip_length}s)
          </span>
          <span className="text-slate-600">•</span>
          <span>{clips.length} Clips Total</span>
          {clips.some((c) => c.videoUrl) && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">
                {clips.filter((c) => c.videoUrl).length} Uploaded Files Attached
              </span>
            </>
          )}
        </div>

        {/* Right: Audio & Fullscreen & Generate */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
