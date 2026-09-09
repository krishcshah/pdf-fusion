import React, { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Upload, RotateCw, Download, Loader2 } from 'lucide-react';
import { downloadBytes } from '../lib/pdfUtils';
import { PdfPageThumbnail } from '../components/PdfThumbnail';

export default function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const count = doc.getPageCount();
      setPageCount(count);
      setRotations(Array(count).fill(0));
    } catch (e: any) { setError(e.message); }
  };

  const rotateAll = (deg: number) => {
    setRotations(prev => prev.map(r => (r + deg) % 360));
  };

  const rotateOne = (idx: number, deg: number) => {
    setRotations(prev => prev.map((r, i) => i === idx ? (r + deg) % 360 : r));
  };

  const save = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab);
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p, i) => {
        p.setRotation(degrees(rotations[i]));
        out.addPage(p);
      });
      const bytes = await out.save();
      downloadBytes(bytes, `rotated-${file.name}`);
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Rotate PDF</h1>
        <p className="text-zinc-500 mb-8">Rotate pages permanently. 90°, 180°, 270°.</p>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to rotate</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rotate: {file.name}</h1>
          <p className="text-sm text-zinc-500">{pageCount} pages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => rotateAll(90)} className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm flex items-center gap-1"><RotateCw className="w-4 h-4" /> Rotate all 90°</button>
          <button onClick={() => setFile(null)} className="px-3 py-2 bg-zinc-100 rounded-xl text-sm">Change</button>
          <button onClick={save} disabled={isProcessing} className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2">{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save</button>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {rotations.map((rot, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono">Page {idx + 1}</span>
              <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">{rot}°</span>
            </div>
            <div style={{ transform: `rotate(${rot}deg)` }} className="transition-transform duration-300">
              <PdfPageThumbnail file={file} pageIndex={idx} width={160} className="mx-auto" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              <button onClick={() => rotateOne(idx, 90)} className="py-1 bg-zinc-50 hover:bg-zinc-100 rounded text-xs">90°</button>
              <button onClick={() => rotateOne(idx, 180)} className="py-1 bg-zinc-50 hover:bg-zinc-100 rounded text-xs">180°</button>
              <button onClick={() => rotateOne(idx, 270)} className="py-1 bg-zinc-50 hover:bg-zinc-100 rounded text-xs">270°</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
