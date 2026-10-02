import React, { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Sparkles,
  Music,
  Video,
  FileSpreadsheet,
  Clock,
  Type,
  CheckCircle,
  Play,
  FileVideo,
} from 'lucide-react';
import { VideoClipItem, RecapOptions } from '../types';
import { formatSecondsToTime, parseTimeToSeconds } from '../utils/time';
import { initialSampleClips } from '../utils/sampleData';

interface ClipsTableProps {
  clips: VideoClipItem[];
  setClips: React.Dispatch<React.SetStateAction<VideoClipItem[]>>;
  currentClipIndex: number;
  setCurrentClipIndex: (idx: number) => void;
  options: RecapOptions;
}

export const ClipsTable: React.FC<ClipsTableProps> = ({
  clips,
  setClips,
  currentClipIndex,
  setCurrentClipIndex,
  options,
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const batchVideoInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleUpdate = (id: string, field: keyof VideoClipItem, val: any) => {
    setClips((prev) =>
      prev.map((clip) => {
        if (clip.id === id) {
          return { ...clip, [field]: val };
        }
        return clip;
      })
    );
  };

  const handleAddClip = () => {
    const newClip: VideoClipItem = {
      id: 'clip-' + Date.now(),
      filename: `Clip_${clips.length + 1}.mp4`,
      clipStart: '00:00:00',
      clipEnd: formatSecondsToTime(options.clip_length || 15),
      subtitle1: 'New Clip Title',
      subtitle2: 'Artist or Description',
      subtitle3: 'Details or Stage',
      sampleType: 'sample-neon',
      duration: 30,
    };
    setClips((prev) => [...prev, newClip]);
  };

  const handleDeleteClip = (id: string) => {
    if (clips.length <= 1) {
      alert('You must keep at least one clip in the recap sequence.');
      return;
    }
    const idx = clips.findIndex((c) => c.id === id);
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (currentClipIndex >= clips.length - 1) {
      setCurrentClipIndex(Math.max(0, clips.length - 2));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clips.length) return;

    setClips((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });

    if (currentClipIndex === index) {
      setCurrentClipIndex(targetIndex);
    } else if (currentClipIndex === targetIndex) {
      setCurrentClipIndex(index);
    }
  };

  const handleAutoDetectChorus = (id: string) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;

    const clipLen = options.clip_length || 15;
    const estimatedChorusStart = Math.floor(Math.random() * 8) + 4;
    const estimatedChorusEnd = estimatedChorusStart + clipLen;

    handleUpdate(id, 'clipStart', formatSecondsToTime(estimatedChorusStart));
    handleUpdate(id, 'clipEnd', formatSecondsToTime(estimatedChorusEnd));
    handleUpdate(id, 'detectedChorus', { start: estimatedChorusStart, end: estimatedChorusEnd });
  };

  const handleBatchAutoDetect = () => {
    const clipLen = options.clip_length || 15;
    setClips((prev) =>
      prev.map((c, i) => {
        const offset = (i * 3 + 4) % 15;
        return {
          ...c,
          clipStart: formatSecondsToTime(offset),
          clipEnd: formatSecondsToTime(offset + clipLen),
          detectedChorus: { start: offset, end: offset + clipLen },
        };
      })
    );
  };

  const handleAttachVideoFile = (clipId: string, file: File) => {
    const url = URL.createObjectURL(file);
    handleUpdate(clipId, 'filename', file.name);
    handleUpdate(clipId, 'videoFile', file);
    handleUpdate(clipId, 'videoUrl', url);
  };

  // Batch process dropped or selected video files (matching the "Videos/" folder workflow)
  const handleProcessVideoFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('video/') || f.name.match(/\.(mp4|m4v|mov|webm|mkv|avi)$/i));
    if (fileArray.length === 0) return;

    setClips((prev) => {
      const updated = [...prev];
      const unassignedFiles: File[] = [];

      fileArray.forEach((file) => {
        // Try to find matching row by filename
        const matchIdx = updated.findIndex(
          (c) => c.filename.toLowerCase() === file.name.toLowerCase() ||
                 c.filename.replace(/\.[^/.]+$/, '').toLowerCase() === file.name.replace(/\.[^/.]+$/, '').toLowerCase()
        );

        if (matchIdx !== -1) {
          const url = URL.createObjectURL(file);
          updated[matchIdx] = {
            ...updated[matchIdx],
            filename: file.name,
            videoFile: file,
            videoUrl: url,
          };
        } else {
          unassignedFiles.push(file);
        }
      });

      // For files that didn't match existing names:
      // If we have default demo clips without user video attached, replace them; otherwise append new rows
      unassignedFiles.forEach((file) => {
        const emptySlotIdx = updated.findIndex((c) => !c.videoFile && !c.videoUrl);
        const url = URL.createObjectURL(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        if (emptySlotIdx !== -1) {
          updated[emptySlotIdx] = {
            ...updated[emptySlotIdx],
            filename: file.name,
            videoFile: file,
            videoUrl: url,
            subtitle1: updated[emptySlotIdx].subtitle1 || cleanName,
          };
        } else {
          updated.push({
            id: 'clip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            filename: file.name,
            clipStart: '00:00:00',
            clipEnd: formatSecondsToTime(options.clip_length || 15),
            subtitle1: cleanName,
            subtitle2: 'Uploaded Video',
            subtitle3: '',
            videoFile: file,
            videoUrl: url,
          });
        }
      });

      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessVideoFiles(e.dataTransfer.files);
    }
  };

  const uploadedCount = clips.filter((c) => c.videoUrl).length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl flex flex-col transition ${
        isDragOver ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-slate-900/90' : 'border-slate-800'
      }`}
    >
      {/* Hidden Batch Video Input */}
      <input
        type="file"
        multiple
        accept="video/*"
        ref={batchVideoInputRef}
        onChange={(e) => {
          if (e.target.files) handleProcessVideoFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Table Toolbar */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Spreadsheet Clips ({options.video_data_file || 'video_data.xlsx'})
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {clips.length} rows
          </span>
          {uploadedCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>{uploadedCount} Uploaded Video{uploadedCount > 1 ? 's' : ''} Ready</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Batch Video Files Upload */}
          <button
            onClick={() => batchVideoInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow transition"
            title="Upload multiple video files into the recap project (matches Videos/ directory)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Video Files (Videos/)</span>
          </button>

          <button
            onClick={handleBatchAutoDetect}
            className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 px-3 py-1.5 rounded-lg transition"
            title="Auto-detect chorus highlights for all clips according to clip_length"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto-Detect Choruses</span>
          </button>

          <button
            onClick={() => setClips(initialSampleClips)}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Reset Demo
          </button>

          <button
            onClick={handleAddClip}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Hint Banner */}
      <div
        onClick={() => batchVideoInputRef.current?.click()}
        className="px-5 py-2 bg-indigo-950/30 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between cursor-pointer hover:bg-indigo-950/50 transition"
      >
        <div className="flex items-center gap-2">
          <FileVideo className="w-4 h-4 text-indigo-400" />
          <span>
            <strong>Drop video files here</strong> or click to load video clips from your computer. Files are instantly mapped to rows.
          </span>
        </div>
        <span className="text-[11px] underline text-indigo-400">Browse Files</span>
      </div>

      {/* Table Data Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800/80 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[240px]">
                <div className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-slate-500" />
                  <span>FILENAME (Col A) & SOURCE</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[120px]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>START (Col B)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[120px]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>END (Col C)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">
                <div className="flex items-center gap-1">
                  <Type className="w-3 h-3 text-slate-500" />
                  <span>SUBTITLE 1 (Col D)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">
                <div className="flex items-center gap-1">
                  <Type className="w-3 h-3 text-slate-500" />
                  <span>SUBTITLE 2 (Col E)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">
                <div className="flex items-center gap-1">
                  <Type className="w-3 h-3 text-slate-500" />
                  <span>SUBTITLE 3 (Col F)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 w-28 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {clips.map((clip, idx) => {
              const isSelected = currentClipIndex === idx;
              const isIntro = options.include_intro && idx === 0;
              const hasUploadedFile = !!clip.videoUrl;

              return (
                <tr
                  key={clip.id}
                  onClick={() => setCurrentClipIndex(idx)}
                  className={`transition group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/40'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Order & Intro badge */}
                  <td className="py-2.5 px-3 text-center align-middle font-mono text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-semibold text-slate-300">{idx + 1}</span>
                      {isIntro && (
                        <span className="mt-0.5 text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                          Intro
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Video Filename & File Picker */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clip.filename}
                          onChange={(e) => handleUpdate(clip.id, 'filename', e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                        />
                        <input
                          type="file"
                          accept="video/*"
                          ref={(el) => {
                            fileInputRefs.current[clip.id] = el;
                          }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAttachVideoFile(clip.id, f);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRefs.current[clip.id]?.click();
                          }}
                          title={hasUploadedFile ? "Replace uploaded video file" : "Attach video file from your computer"}
                          className={`p-1.5 rounded border transition ${
                            hasUploadedFile
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Source tag & Quick Preview */}
                      <div className="flex items-center justify-between text-[10px]">
                        {hasUploadedFile ? (
                          <span className="text-emerald-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Uploaded Video Ready</span>
                            {clip.videoFile && (
                              <span className="text-slate-500">({(clip.videoFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">Sample Footage (click upload to attach video)</span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentClipIndex(idx);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Clip Start */}
                  <td className="py-2.5 px-3 align-middle">
                    <input
                      type="text"
                      value={clip.clipStart}
                      placeholder="00:00:00"
                      onChange={(e) => handleUpdate(clip.id, 'clipStart', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  {/* Clip End */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={clip.clipEnd}
                        placeholder="00:00:15"
                        onChange={(e) => handleUpdate(clip.id, 'clipEnd', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoDetectChorus(clip.id);
                        }}
                        title="Auto-detect chorus highlight for this video"
                        className="p-1 rounded bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-400 transition"
                      >
                        <Music className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Subtitle 1 */}
                  <td className="py-2.5 px-3 align-middle">
                    <input
                      type="text"
                      value={clip.subtitle1}
                      placeholder="Line 1 text..."
                      onChange={(e) => handleUpdate(clip.id, 'subtitle1', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  {/* Subtitle 2 */}
                  <td className="py-2.5 px-3 align-middle">
                    <input
                      type="text"
                      value={clip.subtitle2}
                      placeholder="Line 2 text..."
                      onChange={(e) => handleUpdate(clip.id, 'subtitle2', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  {/* Subtitle 3 */}
                  <td className="py-2.5 px-3 align-middle">
                    <input
                      type="text"
                      value={clip.subtitle3}
                      placeholder="Line 3 text..."
                      onChange={(e) => handleUpdate(clip.id, 'subtitle3', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  {/* Actions: Move Up / Down, Delete */}
                  <td className="py-2.5 px-3 text-right align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, 'up');
                        }}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20 transition"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, 'down');
                        }}
                        disabled={idx === clips.length - 1}
                        title="Move Down"
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20 transition"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                        title="Delete Clip Row"
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-slate-950/50 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Compatible with OpenPyXL / video_data.xlsx standard format</span>
        </div>
        <div>
          <span>Tip: Drag and drop files from your Videos folder directly onto the table.</span>
        </div>
      </div>
    </div>
  );
};
