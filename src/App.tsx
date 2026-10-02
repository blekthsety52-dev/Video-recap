import React, { useState } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { ClipsTable } from './components/ClipsTable';
import { OptionsPanel } from './components/OptionsPanel';
import { ExportModal } from './components/ExportModal';
import { CliDocsModal } from './components/CliDocsModal';
import { GeneratedResultCard } from './components/GeneratedResultCard';
import { initialSampleClips } from './utils/sampleData';
import { defaultOptions } from './utils/yaml';
import { VideoClipItem, RecapOptions } from './types';
import { parseExcelVideoData } from './utils/excel';
import { renderRecapVideo, RenderProgress, RenderResult } from './utils/videoRenderer';
import { Sparkles, Layers, Film, Video, CheckCircle, Play, Download } from 'lucide-react';

export const App: React.FC = () => {
  const [clips, setClips] = useState<VideoClipItem[]>(initialSampleClips);
  const [options, setOptions] = useState<RecapOptions>(defaultOptions);
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'editor' | 'settings' | 'yaml'>('editor');

  // Export state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [exportResult, setExportResult] = useState<RenderResult | null>(null);
  const [showResultCard, setShowResultCard] = useState<boolean>(true);

  // CLI Docs modal
  const [isCliDocsOpen, setIsCliDocsOpen] = useState(false);

  const handleImportExcel = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelVideoData(buffer);
      if (parsed.length > 0) {
        setClips(parsed);
        setCurrentClipIndex(0);
        alert(`Successfully imported ${parsed.length} clips from ${file.name}`);
      } else {
        alert('No valid rows found in the selected Excel file.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to parse Excel file: ' + err.message);
    }
  };

  const handleStartExport = async () => {
    setIsExportModalOpen(true);
    setIsRendering(true);
    setShowResultCard(true);
    setExportProgress({
      phase: 'Importing data from spreadsheet...',
      percent: 0,
      currentFrame: 0,
      totalFrames: 100,
    });
    setExportResult(null);

    try {
      const result = await renderRecapVideo(clips, options, (p) => {
        setExportProgress(p);
      });
      setExportResult(result);
      setIsRendering(false);
    } catch (err: any) {
      console.error('Export error:', err);
      setIsRendering(false);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    }
  };

  const activeClip = clips[currentClipIndex];
  const isUploadedVideo = !!activeClip?.videoUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        clips={clips}
        options={options}
        onImportExcel={handleImportExcel}
        onOpenCliDocs={() => setIsCliDocsOpen(true)}
        onStartExport={handleStartExport}
        hasResult={!!exportResult}
        onViewResult={() => {
          setShowResultCard(true);
          setIsExportModalOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Prominent Generated Video Result Showcase (appears right here when generated!) */}
        {exportResult && showResultCard && (
          <GeneratedResultCard
            result={exportResult}
            outputFilename={options.output_file || 'recap.mp4'}
            onReGenerate={handleStartExport}
            onDismiss={() => setShowResultCard(false)}
          />
        )}

        {/* Editor Tab: Player + Clips Spreadsheet */}
        {activeTab === 'editor' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Grid: Video Preview & Quick Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 16:9 Video Canvas Player */}
              <div className="lg:col-span-8">
                <VideoPlayer
                  clips={clips}
                  options={options}
                  currentClipIndex={currentClipIndex}
                  setCurrentClipIndex={setCurrentClipIndex}
                  onGenerateRecap={handleStartExport}
                />
              </div>

              {/* Active Clip Inspector & Fast Config */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Clip #{currentClipIndex + 1} Inspector
                    </h3>
                  </div>
                  {isUploadedVideo ? (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Uploaded Video</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      Sample Footage
                    </span>
                  )}
                </div>

                {activeClip && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Target Filename</span>
                      <div className="p-2 rounded-lg bg-slate-950 font-mono text-indigo-300 border border-slate-800 truncate flex items-center justify-between">
                        <span className="truncate">{activeClip.filename}</span>
                        {isUploadedVideo && (
                          <span className="text-[10px] text-emerald-400 shrink-0 font-sans ml-1">● Loaded</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <span className="text-slate-400 block mb-1">Start Time</span>
                        <div className="p-2 rounded-lg bg-slate-950 text-slate-200 border border-slate-800">
                          {activeClip.clipStart}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">End Time</span>
                        <div className="p-2 rounded-lg bg-slate-950 text-slate-200 border border-slate-800">
                          {activeClip.clipEnd}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Subtitles Preview</span>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                        <div className="font-semibold text-white truncate">
                          {activeClip.subtitle1 || <span className="text-slate-600 italic">No line 1</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {activeClip.subtitle2 || <span className="text-slate-600 italic">No line 2</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {activeClip.subtitle3 || <span className="text-slate-600 italic">No line 3</span>}
                        </div>
                      </div>
                    </div>

                    {/* Quick Render / Result Trigger */}
                    <div className="pt-2">
                      <button
                        onClick={handleStartExport}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 active:scale-98 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Generate Recap Video ({options.output_file || 'recap.mp4'})</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pad: {options.custom_padding}s</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>1920x1080 FHD</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clips Spreadsheet Table & Video Drop Zone */}
            <ClipsTable
              clips={clips}
              setClips={setClips}
              currentClipIndex={currentClipIndex}
              setCurrentClipIndex={setCurrentClipIndex}
              options={options}
            />
          </div>
        )}

        {/* Settings & Options Tab */}
        {(activeTab === 'settings' || activeTab === 'yaml') && (
          <div className="animate-fade-in">
            <OptionsPanel options={options} setOptions={setOptions} />
          </div>
        )}
      </main>

      {/* Video Generation Progress & Download Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        progress={exportProgress}
        result={exportResult}
        isRendering={isRendering}
        onStartExport={handleStartExport}
        outputFilename={options.output_file || 'recap.mp4'}
      />

      {/* CLI & Docker Documentation Modal */}
      <CliDocsModal
        isOpen={isCliDocsOpen}
        onClose={() => setIsCliDocsOpen(false)}
      />
    </div>
  );
};
export default App;
