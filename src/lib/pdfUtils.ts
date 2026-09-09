import { PDFDocument, rgb, StandardFonts, degrees, PDFPage } from 'pdf-lib';

export const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadBytes = (bytes: Uint8Array, filename: string, type = 'application/pdf') => {
  const blob = new Blob([bytes as any], { type });
  downloadBlob(blob, filename);
};

export async function getPdfPageCount(file: File): Promise<number> {
  const ab = await file.arrayBuffer();
  const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function loadPdfDoc(file: File) {
  const ab = await file.arrayBuffer();
  return await PDFDocument.load(ab, { ignoreEncryption: true });
}

export function parsePageRanges(input: string, maxPages: number): number[] {
  // input like "1-3,5,7-9" -> zero-based indices
  const pages = new Set<number>();
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [s, e] = part.split('-').map(v => parseInt(v.trim(), 10));
      if (isNaN(s) || isNaN(e)) continue;
      const start = Math.max(1, Math.min(s, e));
      const end = Math.min(maxPages, Math.max(s, e));
      for (let i = start; i <= end; i++) pages.add(i - 1);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= maxPages) pages.add(n - 1);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}
