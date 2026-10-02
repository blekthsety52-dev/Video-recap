import yaml from 'js-yaml';
import { RecapOptions } from '../types';

export const defaultOptions: RecapOptions = {
  video_data_file: 'video_data.xlsx',
  video_directory: 'Videos',
  output_file: 'recap.mp4',
  clip_selection_method: 'auto',
  clip_length: 15,
  sub_alignment: 'left',
  sub_font_file: 'Fonts/LiberationSans-Regular.ttf',
  sub_font_size: 50,
  sub_text_color: '#ffffff',
  sub_stroke_color: '#000000',
  sub_stroke_width: 3,
  include_intro: false,
  use_overlay_intro_image: false,
  intro_image_file: 'intro.png',
  intro_image_duration: 10,
  make_intro_image_fullscreen: true,
  intro_font_file: 'Fonts/LiberationSans-Bold.ttf',
  intro_font_size: 150,
  intro_text_color: '#ffffff',
  intro_stroke_color: '#000000',
  intro_stroke_width: 3,
  custom_padding: 1.0,
};

export function parseYamlOptions(yamlString: string): Partial<RecapOptions> {
  try {
    const parsed = yaml.load(yamlString) as any;
    if (parsed && typeof parsed === 'object') {
      return {
        ...defaultOptions,
        ...parsed,
        // normalize colors if needed
        sub_text_color: parsed.sub_text_color || defaultOptions.sub_text_color,
        sub_stroke_color: parsed.sub_stroke_color || defaultOptions.sub_stroke_color,
      };
    }
  } catch (e) {
    console.error('Failed to parse YAML options', e);
  }
  return defaultOptions;
}

export function dumpYamlOptions(options: RecapOptions): string {
  const headerComment = `# ==========================================\n# Recap Video Generator Options\n# Generated automatically from Web Studio\n# ==========================================\n\n`;
  const cleanObj: any = {
    video_data_file: options.video_data_file,
    video_directory: options.video_directory,
    output_file: options.output_file,
    clip_selection_method: options.clip_selection_method,
    clip_length: options.clip_length,
    sub_alignment: options.sub_alignment,
    sub_font_file: options.sub_font_file,
    sub_font_size: options.sub_font_size,
    sub_text_color: options.sub_text_color,
    sub_stroke_color: options.sub_stroke_color,
    sub_stroke_width: options.sub_stroke_width,
    include_intro: options.include_intro,
    use_overlay_intro_image: options.use_overlay_intro_image,
    intro_image_file: options.intro_image_file,
    intro_image_duration: options.intro_image_duration,
    make_intro_image_fullscreen: options.make_intro_image_fullscreen,
    intro_font_file: options.intro_font_file,
    intro_font_size: options.intro_font_size,
    intro_text_color: options.intro_text_color,
    intro_stroke_color: options.intro_stroke_color,
    intro_stroke_width: options.intro_stroke_width,
  };
  return headerComment + yaml.dump(cleanObj, { indent: 2, lineWidth: -1 });
}

export function downloadYamlFile(options: RecapOptions, filename = 'options.yaml') {
  const content = dumpYamlOptions(options);
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
