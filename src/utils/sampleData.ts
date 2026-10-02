import { VideoClipItem } from '../types';

export const initialSampleClips: VideoClipItem[] = [
  {
    id: 'clip-1',
    filename: 'Intro_Welcome.mp4',
    clipStart: '00:00:00',
    clipEnd: '00:00:08',
    subtitle1: 'SUMMER RECAP 2026',
    subtitle2: 'BEST MOMENTS & PERFORMANCES',
    subtitle3: 'LIVE AT SUNSET ARENA',
    sampleType: 'sample-sunset',
    duration: 30,
    detectedChorus: { start: 0, end: 8 }
  },
  {
    id: 'clip-2',
    filename: 'Concert_MainStage.mp4',
    clipStart: '00:00:04',
    clipEnd: '00:00:16',
    subtitle1: 'Midnight Serenade',
    subtitle2: 'Electric Symphony Orchestra',
    subtitle3: 'Crowd Chorus & Light Show',
    sampleType: 'sample-neon',
    duration: 45,
    detectedChorus: { start: 4, end: 16 }
  },
  {
    id: 'clip-3',
    filename: 'Festival_SunsetCrowd.mp4',
    clipStart: '00:00:06',
    clipEnd: '00:00:18',
    subtitle1: 'Golden Horizon',
    subtitle2: 'Acoustic Waves',
    subtitle3: 'Acoustic Stage • 94 BPM',
    sampleType: 'sample-ocean',
    duration: 40,
    detectedChorus: { start: 6, end: 18 }
  },
  {
    id: 'clip-4',
    filename: 'Grand_Finale_Fireworks.mp4',
    clipStart: '00:00:05',
    clipEnd: '00:00:17',
    subtitle1: 'All We Need Is Love',
    subtitle2: 'The Grand Ensemble ft. All Stars',
    subtitle3: 'Midnight Pyro & Countdown',
    sampleType: 'sample-stage',
    duration: 50,
    detectedChorus: { start: 5, end: 17 }
  }
];

/**
 * Creates dynamic canvas frames representing a video clip.
 */
export function drawSampleVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number,
  sampleType: string,
  filename: string
) {
  // Clear with black (matches 1920x1080-black.jpg requirement)
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, width, height);

  // Background visual themes
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (sampleType === 'sample-sunset') {
    grad.addColorStop(0, '#1e112a');
    grad.addColorStop(0.5, '#7c2d12');
    grad.addColorStop(1, '#ca8a04');
  } else if (sampleType === 'sample-neon') {
    grad.addColorStop(0, '#090d20');
    grad.addColorStop(0.5, '#4c1d95');
    grad.addColorStop(1, '#06b6d4');
  } else if (sampleType === 'sample-ocean') {
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(0.5, '#065f46');
    grad.addColorStop(1, '#0284c7');
  } else if (sampleType === 'sample-stage') {
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#831843');
    grad.addColorStop(1, '#f43f5e');
  } else {
    grad.addColorStop(0, '#111827');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#4338ca');
  }

  // Draw 16:9 simulated footage inside canvas
  const footageMargin = 0;
  const fw = width - footageMargin * 2;
  const fh = height - footageMargin * 2;
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(footageMargin, footageMargin, fw, fh);

  // Animated elements (pulsing lights, sound waves, spotlights)
  const t = timeSec * 2.5;

  // Moving light orbs
  for (let i = 0; i < 5; i++) {
    const angle = t * 0.8 + i * 1.4;
    const cx = width / 2 + Math.sin(angle) * (width * 0.35);
    const cy = height / 2 + Math.cos(angle * 1.2) * (height * 0.28);
    const r = 120 + Math.sin(t + i) * 50;

    const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    orbGrad.addColorStop(0.5, 'rgba(238, 242, 255, 0.15)');
    orbGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dynamic rhythmic frequency bars in lower mid ground
  const barCount = 32;
  const barWidth = width * 0.7 / barCount;
  const startX = width * 0.15;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let b = 0; b < barCount; b++) {
    const h = 20 + Math.abs(Math.sin(t * 3 + b * 0.3)) * 140;
    const bx = startX + b * barWidth;
    const by = height * 0.65 - h;
    ctx.fillRect(bx, by, barWidth - 4, h);
  }

  // Overlay HUD metadata
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`REC ● [${filename}]`, 48, 64);

  const mins = Math.floor(timeSec / 60).toString().padStart(2, '0');
  const secs = Math.floor(timeSec % 60).toString().padStart(2, '0');
  const frames = Math.floor((timeSec % 1) * 30).toString().padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.fillText(`TC ${mins}:${secs}:${frames}`, width - 48, 64);

  ctx.restore();
}
