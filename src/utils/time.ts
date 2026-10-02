/**
 * Converts "hh:mm:ss", "mm:ss", or raw seconds string/number into seconds (float).
 */
export function parseTimeToSeconds(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.max(0, val);
  
  const trimmed = val.toString().trim();
  if (!trimmed) return 0;

  // If plain number
  if (!trimmed.includes(':') && !isNaN(Number(trimmed))) {
    return Math.max(0, Number(trimmed));
  }

  const parts = trimmed.split(':').map(p => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Formats seconds into "hh:mm:ss" or "mm:ss".
 */
export function formatSecondsToTime(seconds: number, forceHours: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (forceHours || h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}
