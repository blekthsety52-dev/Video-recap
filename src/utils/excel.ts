import * as XLSX from 'xlsx';
import { VideoClipItem } from '../types';

export function parseExcelVideoData(data: ArrayBuffer): VideoClipItem[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) return [];

  const items: VideoClipItem[] = [];
  // Skip header if first cell contains "FILENAME"
  let startIndex = 0;
  if (rawRows[0] && String(rawRows[0][0]).toUpperCase().includes('FILE')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row[0]) continue;
    const filename = String(row[0]).trim();
    if (!filename) continue;

    items.push({
      id: 'clip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      filename,
      clipStart: row[1] !== undefined ? String(row[1]).trim() : '00:00:00',
      clipEnd: row[2] !== undefined ? String(row[2]).trim() : '00:00:15',
      subtitle1: row[3] !== undefined ? String(row[3]).trim() : '',
      subtitle2: row[4] !== undefined ? String(row[4]).trim() : '',
      subtitle3: row[5] !== undefined ? String(row[5]).trim() : '',
    });
  }

  return items;
}

export function exportExcelVideoData(clips: VideoClipItem[], filename = 'video_data.xlsx') {
  const rows = [
    ['FILENAME', 'CLIP START', 'CLIP END', 'SUBTITLE 1', 'SUBTITLE 2', 'SUBTITLE 3'],
    ...clips.map(c => [
      c.filename,
      c.clipStart,
      c.clipEnd,
      c.subtitle1 || '',
      c.subtitle2 || '',
      c.subtitle3 || ''
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 24 }, // FILENAME
    { wch: 14 }, // CLIP START
    { wch: 14 }, // CLIP END
    { wch: 28 }, // SUBTITLE 1
    { wch: 28 }, // SUBTITLE 2
    { wch: 28 }, // SUBTITLE 3
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recap Clips');

  XLSX.writeFile(workbook, filename);
}
