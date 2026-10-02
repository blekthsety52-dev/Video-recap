import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Sparkles,
  FolderOpen,
  Image,
  Layers,
  FileCode,
  Download,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { RecapOptions } from '../types';
import { defaultOptions, dumpYamlOptions, downloadYamlFile, parseYamlOptions } from '../utils/yaml';

interface OptionsPanelProps {
  options: RecapOptions;
  setOptions: React.Dispatch<React.SetStateAction<RecapOptions>>;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ options, setOptions }) => {
  const [yamlCopied, setYamlCopied] = useState(false);
  const [yamlText, setYamlText] = useState(() => dumpYamlOptions(options));
  const [yamlError, setYamlError] = useState<string | null>(null);
  const isTypingYamlRef = React.useRef(false);

  // Keep YAML text in sync with options state unless user is actively typing in YAML editor
  React.useEffect(() => {
    if (!isTypingYamlRef.current) {
      setYamlText(dumpYamlOptions(options));
    }
  }, [options]);

  const handleChange = <K extends keyof RecapOptions>(key: K, val: RecapOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: val }));
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlText);
    setYamlCopied(true);
    setTimeout(() => setYamlCopied(false), 2000);
  };

  const handleApplyYamlText = (text: string) => {
    setYamlText(text);
    try {
      const parsed = parseYamlOptions(text);
      setOptions((prev) => ({ ...prev, ...parsed }));
      setYamlError(null);
    } catch (e: any) {
      setYamlError(e.message || 'Invalid YAML format');
    }
  };

  const resetToDefault = () => {
    setOptions(defaultOptions);
    setYamlError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Recap Generation Options (options.yaml)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure clip extraction methods, subtitle styling, intro graphics, and crossfade transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={() => downloadYamlFile(options, 'options.yaml')}
            className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download options.yaml</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Clip Selection & Method */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3>Clip Selection & Audio Highlights</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Clip Selection Method (<code className="text-cyan-400">clip_selection_method</code>)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('clip_selection_method', 'auto')}
                  className={`p-3 rounded-xl border text-left transition ${
                    options.clip_selection_method === 'auto'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-indigo-400">Auto (Chorus Detection)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Detects peak musical chorus or audio energy automatically.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('clip_selection_method', 'manual')}
                  className={`p-3 rounded-xl border text-left transition ${
                    options.clip_selection_method === 'manual'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-indigo-400">Manual (Timestamps)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Uses exact start and end times defined in spreadsheet.
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Auto Clip Length in Seconds (<code className="text-cyan-400">clip_length</code>)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={options.clip_length}
                  onChange={(e) => handleChange('clip_length', parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="w-16 font-mono text-sm px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-center text-slate-200">
                  {options.clip_length}s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Only applies when auto chorus detection is active for a clip.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Crossfade Transition Padding (<code className="text-cyan-400">custom_padding</code>)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={options.custom_padding}
                  onChange={(e) => handleChange('custom_padding', parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="w-16 font-mono text-sm px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-center text-slate-200">
                  {options.custom_padding}s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Duration of audio fade-in/out and video crossfade between adjacent clips.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Subtitle Properties */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Type className="w-4 h-4 text-indigo-400" />
            <h3>Subtitle Properties (SubtitlesClip)</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Sub Alignment */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Alignment (<code className="text-cyan-400">sub_alignment</code>)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => handleChange('sub_alignment', align)}
                    className={`py-2 px-3 rounded-lg border text-center capitalize font-medium transition ${
                      options.sub_alignment === align
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Font Family (<code className="text-cyan-400">sub_font_file</code>)
                </label>
                <select
                  value={options.sub_font_file}
                  onChange={(e) => handleChange('sub_font_file', e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="Fonts/LiberationSans-Regular.ttf">Liberation Sans Regular</option>
                  <option value="Fonts/LiberationSans-Bold.ttf">Liberation Sans Bold</option>
                  <option value="Fonts/LiberationSerif-Regular.ttf">Liberation Serif Regular</option>
                  <option value="Fonts/LiberationSerif-Bold.ttf">Liberation Serif Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Font Size (<code className="text-cyan-400">sub_font_size</code>)
                </label>
                <input
                  type="number"
                  min={20}
                  max={120}
                  value={options.sub_font_size}
                  onChange={(e) => handleChange('sub_font_size', parseInt(e.target.value) || 50)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Colors & Stroke */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Text Color (<code className="text-cyan-400">sub_text_color</code>)
                </label>
                <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-1">
                  <input
                    type="color"
                    value={options.sub_text_color.startsWith('#') ? options.sub_text_color : '#ffffff'}
                    onChange={(e) => handleChange('sub_text_color', e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={options.sub_text_color}
                    onChange={(e) => handleChange('sub_text_color', e.target.value)}
                    className="w-full bg-transparent text-slate-200 font-mono text-[11px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Stroke Color (<code className="text-cyan-400">sub_stroke_color</code>)
                </label>
                <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-1">
                  <input
                    type="color"
                    value={options.sub_stroke_color.startsWith('#') ? options.sub_stroke_color : '#000000'}
                    onChange={(e) => handleChange('sub_stroke_color', e.target.value)}
                    className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={options.sub_stroke_color}
                    onChange={(e) => handleChange('sub_stroke_color', e.target.value)}
                    className="w-full bg-transparent text-slate-200 font-mono text-[11px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Stroke Width (<code className="text-cyan-400">sub_stroke_width</code>)
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={options.sub_stroke_width}
                  onChange={(e) => handleChange('sub_stroke_width', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Intro Properties */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <Image className="w-4 h-4 text-amber-400" />
            <h3>Intro Clip & Overlay Card</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Include intro toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200">Include Intro Clip</span>
                <p className="text-[11px] text-slate-400">
                  Treats Clip #1 as an intro; subtitles are placed large in center of screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('include_intro', !options.include_intro)}
                className={`w-11 h-6 rounded-full transition relative ${
                  options.include_intro ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition absolute top-0.5 ${
                    options.include_intro ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Overlay Intro Image */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200">Use Overlay Intro Image</span>
                <p className="text-[11px] text-slate-400">
                  Overlays custom PNG/JPG graphic over the first intro clip.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('use_overlay_intro_image', !options.use_overlay_intro_image)}
                className={`w-11 h-6 rounded-full transition relative ${
                  options.use_overlay_intro_image ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition absolute top-0.5 ${
                    options.use_overlay_intro_image ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Intro Font Size (<code className="text-cyan-400">intro_font_size</code>)
                </label>
                <input
                  type="number"
                  min={60}
                  max={250}
                  value={options.intro_font_size}
                  onChange={(e) => handleChange('intro_font_size', parseInt(e.target.value) || 150)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Image Duration (<code className="text-cyan-400">intro_image_duration</code>)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={options.intro_image_duration}
                  onChange={(e) => handleChange('intro_image_duration', parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: File Locations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <h3>CLI File Locations</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Video Data Spreadsheet (<code className="text-cyan-400">video_data_file</code>)
              </label>
              <input
                type="text"
                value={options.video_data_file}
                onChange={(e) => handleChange('video_data_file', e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Video Directory Folder (<code className="text-cyan-400">video_directory</code>)
              </label>
              <input
                type="text"
                value={options.video_directory}
                onChange={(e) => handleChange('video_directory', e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Output File Name (<code className="text-cyan-400">output_file</code>)
              </label>
              <input
                type="text"
                value={options.output_file}
                onChange={(e) => handleChange('output_file', e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Raw YAML Code Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Raw YAML Editor (options.yaml)</h3>
          </div>

          <button
            onClick={handleCopyYaml}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            {yamlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{yamlCopied ? 'Copied' : 'Copy YAML'}</span>
          </button>
        </div>

        {yamlError && (
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-mono">
            {yamlError}
          </div>
        )}

        <textarea
          rows={14}
          value={yamlText}
          onFocus={() => {
            isTypingYamlRef.current = true;
          }}
          onBlur={() => {
            isTypingYamlRef.current = false;
            setYamlText(dumpYamlOptions(options));
          }}
          onChange={(e) => handleApplyYamlText(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
          placeholder="Paste or edit options.yaml here..."
        />
      </div>
    </div>
  );
};
