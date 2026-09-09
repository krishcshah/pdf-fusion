import React, { useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Upload, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatSize } from '../lib/pdfUtils';

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export default function PdfToImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<{ page: number; dataUrl: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [scale, setScale] = useState(2);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    setImages([]);
    setError(null);
    setIsProcessing(true);
    try {
      const ab = await f.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: ab }).promise;
      const imgs: { page: number; dataUrl: string }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const dataUrl = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.92 : undefined);
        imgs.push({ page: i, dataUrl });
      }
      setImages(imgs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadOne = (dataUrl: string, pageNum: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${file?.name.replace('.pdf', '') || 'page'}-${pageNum}.${format}`;
    a.click();
  };

  const downloadAll = () => {
    images.forEach(img => downloadOne(img.dataUrl, img.page));
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">PDF to Images</h1>
      <p className="text-zinc-500 mb-8">Convert each PDF page to JPG or PNG. High quality, browser-side.</p>

      {!file ? (
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to convert to images</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium text-sm">{file.name} • {formatSize(file.size)}</p>
              <p className="text-xs text-zinc-500">{images.length} pages {isProcessing ? '• Converting...' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={format} onChange={e => setFormat(e.target.value as any)} className="px-3 py-1 border border-zinc-200 rounded-lg text-sm">
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
              </select>
              <select value={scale} onChange={e => { setScale(Number(e.target.value)); if (file) handleFile(file); }} className="px-3 py-1 border border-zinc-200 rounded-lg text-sm">
                <option value={1}>Low quality</option>
                <option value={2}>High quality</option>
                <option value={3}>Ultra HD</option>
              </select>
              <button onClick={() => { setFile(null); setImages([]); }} className="px-3 py-1 bg-zinc-100 rounded-lg text-sm">Change</button>
              {images.length > 0 && <button onClick={downloadAll} className="px-4 py-1 bg-zinc-900 text-white rounded-lg text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Download all</button>}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
          {isProcessing && <div className="flex items-center justify-center gap-2 py-12"><Loader2 className="w-6 h-6 animate-spin" /> Rendering pages...</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map(img => (
              <div key={img.page} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <img src={img.dataUrl} alt={`Page ${img.page}`} className="w-full h-auto" />
                <div className="p-3 flex items-center justify-between">
                  <span className="text-xs font-mono">Page {img.page}</span>
                  <button onClick={() => downloadOne(img.dataUrl, img.page)} className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-xs flex items-center gap-1"><Download className="w-3 h-3" /> {format.toUpperCase()}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
