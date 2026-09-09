import React, { useState, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Upload, Hash, Download, Loader2 } from 'lucide-react';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

export default function PageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right'>('bottom-center');
  const [startFrom, setStartFrom] = useState(1);
  const [format, setFormat] = useState<'{n}' | '{n}/{total}' | 'Page {n}'>('{n}');
  const [fontSize, setFontSize] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    setError(null);
  };

  const apply = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;
      for (let i = 0; i < total; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNum = startFrom + i;
        let text = format.replace('{n}', String(pageNum)).replace('{total}', String(total));
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        let x = width / 2 - textWidth / 2;
        let y = 20;
        if (position === 'bottom-right') { x = width - textWidth - 30; y = 20; }
        if (position === 'bottom-left') { x = 30; y = 20; }
        if (position === 'top-center') { x = width / 2 - textWidth / 2; y = height - 30; }
        if (position === 'top-right') { x = width - textWidth - 30; y = height - 30; }
        if (position === 'bottom-center') { x = width / 2 - textWidth / 2; y = 20; }
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
      }
      const bytes = await doc.save();
      downloadBytes(bytes, `paginated-${file.name}`);
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Page Numbers</h1>
      <p className="text-zinc-500 mb-8">Add page numbers to your PDF with custom position and format.</p>

      {!file ? (
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to add page numbers</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium">{file.name} • {formatSize(file.size)}</p>
            <button onClick={() => setFile(null)} className="px-3 py-1 bg-zinc-100 rounded-lg text-sm">Change</button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Position</label>
                <select value={position} onChange={e => setPosition(e.target.value as any)} className="mt-2 w-full px-3 py-2 border border-zinc-200 rounded-lg">
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Format</label>
                <select value={format} onChange={e => setFormat(e.target.value as any)} className="mt-2 w-full px-3 py-2 border border-zinc-200 rounded-lg">
                  <option value="{n}">1, 2, 3</option>
                  <option value="{n}/{total}">1/10, 2/10</option>
                  <option value="Page {n}">Page 1, Page 2</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Start from</label>
                <input type="number" min={1} value={startFrom} onChange={e => setStartFrom(Number(e.target.value) || 1)} className="mt-2 w-full px-3 py-2 border border-zinc-200 rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Font size: {fontSize}px</label>
                <input type="range" min={8} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-2" />
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

            <button onClick={apply} disabled={isProcessing} className="w-full py-4 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</> : <><Hash className="w-5 h-5" /> Add Page Numbers & Download</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
