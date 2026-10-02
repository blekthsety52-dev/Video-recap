import React, { useState } from 'react';
import { Terminal, Copy, Check, X, ExternalLink, Code2, Server } from 'lucide-react';

interface CliDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CliDocsModal: React.FC<CliDocsModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">CLI & Docker Instructions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Running with Docker</span>
            </h3>
            <p className="text-slate-400 leading-relaxed mb-3">
              Put video files in the <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">Videos</code> folder, export your <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">video_data.xlsx</code> and <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">options.yaml</code>, and run:
            </p>
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300">
              <button
                onClick={() => copyCode('docker build -t recap-generator:latest .\ndocker run --rm -v $PWD:/src recap-generator:latest', 1)}
                className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="pr-8">{`docker build -t recap-generator:latest .\ndocker run --rm -v $PWD:/src recap-generator:latest`}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Running with Local Python Script</span>
            </h3>
            <p className="text-slate-400 leading-relaxed mb-3">
              Requires Python 3.12 and FFmpeg installed on your host system:
            </p>
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300">
              <button
                onClick={() => copyCode('pip install openpyxl moviepy pychorus jsonschema ruamel.yaml\npython3 recap_generator.py', 2)}
                className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="pr-8">{`pip install openpyxl moviepy pychorus jsonschema ruamel.yaml\npython3 recap_generator.py`}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Windows Executable</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              For Windows users who prefer a standalone .exe without Python installed, download the binary from{' '}
              <a
                href="https://berlyne.net/code/recap-generator"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                berlyne.net/code/recap-generator
              </a>{' '}
              and install FFmpeg via <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">winget install ffmpeg</code>.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
