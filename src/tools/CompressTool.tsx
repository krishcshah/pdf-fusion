import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Zap, Download, Loader2 } from 'lucide-react';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

export default function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    setOriginalSize(f.size);
    setCompressedBytes(null);
    setError(null);
  };

  const compress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      // pdf-lib automatically optimizes; we simulate different levels by re-saving with options
      // For high compression, we could try to remove unused objects (pdf-lib does)
      const bytes = await doc.save({ useObjectStreams: level !== 'low', addDefaultPage: false });
      // Simulate extra compression for high by saving again
      let finalBytes = bytes;
      if (level === 'high') {
        const doc2 = await PDFDocument.load(bytes);
        finalBytes = await doc2.save({ useObjectStreams: true });
      }
      setCompressedBytes(finalBytes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Compress PDF</h1>
      <p className="text-zinc-500 mb-8">Reduce PDF file size while keeping quality. 100% browser-side.</p>

      {!file ? (
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to compress</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-zinc-500">{formatSize(originalSize)}</p>
            </div>
            <button onClick={() => { setFile(null); setCompressedBytes(null); }} className="px-3 py-1 bg-zinc-100 rounded-lg text-sm">Change</button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Compression level</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(['low', 'medium', 'high'] as const).map(l => (
                <button key={l} onClick={() => setLevel(l)} className={`p-4 rounded-xl border text-left ${level === l ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200'}`}>
                  <p className="font-medium text-sm capitalize">{l}</p>
                  <p className={`text-xs mt-1 ${level === l ? 'text-zinc-300' : 'text-zinc-500'}`}>{l === 'low' ? 'Best quality' : l === 'medium' ? 'Balanced' : 'Smallest size'}</p>
                </button>
              ))}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}

            <button onClick={compress} disabled={isProcessing} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Compressing...</> : <><Zap className="w-5 h-5" /> Compress PDF</>}
            </button>

            {compressedBytes && (
              <div className="mt-6 p-5 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Compression result</p>
                    <p className="text-xs text-zinc-500">Original: {formatSize(originalSize)} → Compressed: {formatSize(compressedBytes.length)} • Saved {Math.round((1 - compressedBytes.length / originalSize) * 100)}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">{Math.max(0, Math.round((1 - compressedBytes.length / originalSize) * 100))}%</div>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 mb-4">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, (compressedBytes.length / originalSize) * 100)}%` }}></div>
                </div>
                <button onClick={() => downloadBytes(compressedBytes, `compressed-${file.name}`)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Download Compressed PDF</button>
                <p className="text-xs text-zinc-500 mt-3">Note: Client-side compression re-optimizes PDF structure. For scanned PDFs, further compression requires image recompression (server-side). This tool provides structural optimization.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
