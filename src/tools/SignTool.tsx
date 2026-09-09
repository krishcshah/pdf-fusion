import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, PenTool, Download, Loader2, Trash2 } from 'lucide-react';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

export default function SignTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPage, setSelectedPage] = useState(0);
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 100, y: 100, scale: 0.5 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
    };

    const start = (e: any) => { isDrawing.current = true; const { x, y } = getPos(e); ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (e: any) => { if (!isDrawing.current) return; const { x, y } = getPos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault(); };
    const end = () => { isDrawing.current = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('mouseleave', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  }, []);

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSigDataUrl(null);
  };

  const saveSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // check if blank (simple: check if mostly white)
    setSigDataUrl(dataUrl);
  };

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      setPageCount(doc.getPageCount());
    } catch (e: any) { setError(e.message); }
  };

  const applySignature = async () => {
    if (!file || !sigDataUrl) { setError('Draw and save signature first'); return; }
    setIsProcessing(true);
    setError(null);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const pngBytes = await fetch(sigDataUrl).then(r => r.arrayBuffer());
      const pngImage = await doc.embedPng(pngBytes);
      const pages = doc.getPages();
      const page = pages[selectedPage];
      const { width, height } = page.getSize();
      const scaled = pngImage.scale(pos.scale);
      page.drawImage(pngImage, {
        x: pos.x,
        y: height - pos.y - scaled.height, // convert top-left to bottom-left
        width: scaled.width,
        height: scaled.height,
      });
      const bytes = await doc.save();
      downloadBytes(bytes, `signed-${file.name}`);
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Sign PDF</h1>
      <p className="text-zinc-500 mb-8">Draw your signature and place it anywhere on the PDF.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">1. Draw Signature</h3>
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-2 bg-zinc-50">
            <canvas ref={canvasRef} width={600} height={250} className="w-full h-[200px] bg-white rounded-lg cursor-crosshair touch-none" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={clearSig} className="flex-1 py-2 bg-zinc-100 rounded-xl text-sm flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Clear</button>
            <button onClick={saveSig} className="flex-1 py-2 bg-zinc-900 text-white rounded-xl text-sm flex items-center justify-center gap-1"><PenTool className="w-4 h-4" /> Save Signature</button>
          </div>
          {sigDataUrl && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs text-emerald-700 font-medium">Signature saved!</p>
              <img src={sigDataUrl} alt="signature" className="mt-2 h-16 bg-white border border-zinc-200 rounded" />
            </div>
          )}

          {sigDataUrl && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-sm">Position & Size</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">X: {pos.x}</label>
                  <input type="range" min={0} max={500} value={pos.x} onChange={e => setPos({ ...pos, x: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Y: {pos.y}</label>
                  <input type="range" min={0} max={700} value={pos.y} onChange={e => setPos({ ...pos, y: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs">Scale: {pos.scale}</label>
                  <input type="range" min={0.1} max={2} step={0.1} value={pos.scale} onChange={e => setPos({ ...pos, scale: Number(e.target.value) })} className="w-full" />
                </div>
              </div>
              <div>
                <label className="text-xs">Page: {selectedPage + 1} / {pageCount}</label>
                <input type="range" min={0} max={Math.max(0, pageCount - 1)} value={selectedPage} onChange={e => setSelectedPage(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">2. Upload PDF & Apply</h3>
          {!file ? (
            <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-zinc-200 rounded-xl p-10 text-center cursor-pointer hover:border-zinc-400">
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium">Drop PDF here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium truncate">{file.name} • {formatSize(file.size)} • {pageCount} pages</span>
                <button onClick={() => setFile(null)} className="text-xs px-2 py-1 bg-white border rounded">Change</button>
              </div>
              <div className="h-64 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Preview: Page {selectedPage + 1}</p>
                  <div className="mt-2 w-48 h-64 bg-white border border-zinc-300 shadow-sm mx-auto relative">
                    <div className="absolute text-[8px] text-zinc-400 top-2 left-2">PDF Page Preview</div>
                    {sigDataUrl && (
                      <img src={sigDataUrl} alt="sig" style={{ left: `${(pos.x / 500) * 100}%`, top: `${(pos.y / 700) * 100}%`, width: `${pos.scale * 60}px` }} className="absolute" />
                    )}
                  </div>
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
              <button onClick={applySignature} disabled={!sigDataUrl || isProcessing} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing...</> : <><Download className="w-5 h-5" /> Sign & Download</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
