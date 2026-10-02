import React from 'react';
import { Download, Film, CheckCircle, Play, RotateCcw, Share2, Sparkles, X } from 'lucide-react';
import { RenderResult } from '../utils/videoRenderer';
import { formatSecondsToTime } from '../utils/time';

interface GeneratedResultCardProps {
  result: RenderResult | null;
  outputFilename: string;
  onReGenerate: () => void;
  onDismiss: () => void;
}

export const GeneratedResultCard: React.FC<GeneratedResultCardProps> = ({
  result,
  outputFilename,
  onReGenerate,
  onDismiss,
}) => {
  if (!result) return null;

  const downloadName = outputFilename.replace(/\.(mp4|webm)$/i, '') + `.${result.format}`;

  return (
    <div className="bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in relative">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Generated Video Result Ready</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                {result.format.toUpperCase()} 1080p
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Your recap video is fully stitched with audio normalisation, 1-second crossfades, and subtitles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReGenerate}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Generate</span>
          </button>

          <a
            href={result.url}
            download={downloadName}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download {downloadName}</span>
          </a>

          <button
            onClick={onDismiss}
            title="Dismiss result banner"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Player Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 bg-black rounded-xl overflow-hidden border border-slate-800 shadow-xl aspect-video relative group">
          <video
            src={result.url}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Video Metadata & Download Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
              <span className="text-slate-400">File Name:</span>
              <span className="text-indigo-300 font-semibold">{downloadName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
              <span className="text-slate-400">Duration:</span>
              <span className="text-slate-200">{formatSecondsToTime(result.duration, false)}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-mono">
              <span className="text-slate-400">Resolution:</span>
              <span className="text-slate-200">1920 × 1080 (16:9 FHD)</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400">Audio Backend:</span>
              <span className="text-emerald-400">Stereo Normalized</span>
            </div>
          </div>

          <a
            href={result.url}
            download={downloadName}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition"
          >
            <Download className="w-5 h-5" />
            <span>Download Video File ({downloadName})</span>
          </a>

          <p className="text-[11px] text-slate-400 text-center">
            Clicking download saves the finished video to your computer's Downloads folder.
          </p>
        </div>
      </div>
    </div>
  );
};
