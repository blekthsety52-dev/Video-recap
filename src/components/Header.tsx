import React from 'react';
import { Film, FileSpreadsheet, Settings, Download, Upload, Terminal, Play } from 'lucide-react';
import { VideoClipItem, RecapOptions } from '../types';
import { exportExcelVideoData } from '../utils/excel';
import { downloadYamlFile } from '../utils/yaml';

interface HeaderProps {
  clips: VideoClipItem[];
  options: RecapOptions;
  onImportExcel: (file: File) => void;
  onOpenCliDocs: () => void;
  onStartExport: () => void;
  hasResult: boolean;
  onViewResult: () => void;
  activeTab: 'editor' | 'settings' | 'yaml';
  setActiveTab: (tab: 'editor' | 'settings' | 'yaml') => void;
}

export const Header: React.FC<HeaderProps> = ({
  clips,
  options,
  onImportExcel,
  onOpenCliDocs,
  onStartExport,
  hasResult,
  onViewResult,
  activeTab,
  setActiveTab,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportExcel(file);
      e.target.value = '';
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Recap Video Generator</h1>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                1080p Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Auto chorus detection • Subtitles • Crossfade transitions
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'editor'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Clips & Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Options ({options.clip_selection_method})</span>
          </button>
          <button
            onClick={() => setActiveTab('yaml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'yaml'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>options.yaml</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import video_data.xlsx"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import XLSX</span>
          </button>

          <button
            onClick={() => exportExcelVideoData(clips, options.video_data_file || 'video_data.xlsx')}
            title="Export video_data.xlsx"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={onOpenCliDocs}
            title="Original CLI and Docker instructions"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-2 rounded-lg border border-slate-700/60 transition"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CLI Guide</span>
          </button>

          {hasResult && (
            <button
              onClick={onViewResult}
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/50 px-3 py-2 rounded-lg transition animate-pulse font-medium"
              title="View and download generated recap video result"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Result Ready</span>
            </button>
          )}

          <button
            onClick={onStartExport}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-500/20 active:scale-95 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Recap</span>
          </button>
        </div>
      </div>
    </header>
  );
};
