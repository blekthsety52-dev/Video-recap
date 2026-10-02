export interface VideoClipItem {
  id: string;
  filename: string;
  clipStart: string; // "00:00:00" or seconds
  clipEnd: string;   // "00:00:15" or seconds
  subtitle1: string;
  subtitle2: string;
  subtitle3: string;
  videoUrl?: string; // object URL or sample url
  videoFile?: File;
  duration?: number;
  detectedChorus?: { start: number; end: number };
  sampleType?: 'sample-sunset' | 'sample-neon' | 'sample-ocean' | 'sample-stage' | 'sample-retro';
}

export interface RecapOptions {
  video_data_file: string;
  video_directory: string;
  output_file: string;
  clip_selection_method: 'auto' | 'manual';
  clip_length: number;
  sub_alignment: 'left' | 'center' | 'right';
  sub_font_file: string;
  sub_font_size: number;
  sub_text_color: string;
  sub_stroke_color: string;
  sub_stroke_width: number;
  include_intro: boolean;
  use_overlay_intro_image: boolean;
  intro_image_file: string;
  intro_image_duration: number;
  make_intro_image_fullscreen: boolean;
  intro_font_file: string;
  intro_font_size: number;
  intro_text_color: string;
  intro_stroke_color: string;
  intro_stroke_width: number;
  custom_padding: number;
}
