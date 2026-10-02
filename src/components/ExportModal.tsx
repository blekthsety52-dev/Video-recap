import React, { useState } from 'react';
import {
  Film,
  Download,
  X,
  CheckCircle,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { RenderProgress, RenderResult } from '../utils/videoRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: RenderProgress | null;
  result: RenderResult | null;
  isRendering: boolean;
  onStartExport: () => void;
  outputFilename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  result,
  isRendering,
  onStartExport,
  outputFilename,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Generate Video Recap</h2>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {isRendering && progress && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{progress.phase}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Frame {progress.currentFrame} of {progress.totalFrames} • {progress.timeRemaining || 'Rendering...'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 h-full transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Rendering 1080p sequence</span>
                <span className="font-bold text-cyan-400">{progress.percent}%</span>
              </div>

              {/* Terminal Logs Simulation */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="text-slate-500">&gt; python3 recap_generator.py</div>
                <div className="text-emerald-400">&gt; Importing data from spreadsheet... [OK]</div>
                <div className="text-cyan-400">&gt; Extracting clips & normalizing audio... [OK]</div>
                <div className="text-indigo-400">&gt; Resizing clips to 1920x1080... [OK]</div>
                <div className="text-amber-400">&gt; Adding crossfade transitions... [OK]</div>
                <div className="text-pink-400">&gt; Generating subtitles & intro cards...</div>
              </div>
            </div>
          )}

          {!isRendering && result && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Recap Generated Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ready to download in 1080p with all crossfade transitions and subtitles.
                </p>
              </div>

              {/* Video Player Preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                <video
                  src={result.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Download Button */}
              <div className="flex gap-3 pt-2">
                <a
                  href={result.url}
                  download={outputFilename.replace(/\.mp4$/, '') + `.${result.format}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {outputFilename.replace(/\.mp4$/, '')}.{result.format}</span>
                </a>

                <button
                  onClick={onStartExport}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!isRendering && !result && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ready to Render Master Recap</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  This will render and stitch all clips with 1-second crossfade transitions, normalise audio, and burn subtitles into the video file.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onStartExport}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-98 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Encoding ({outputFilename})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
