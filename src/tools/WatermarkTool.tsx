import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Upload, Droplets, Download, Loader2 } from 'lucide-react';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

export default function WatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(50);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#FF0000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    setError(null);
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const apply = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(text, {
          x: width / 2 - (text.length * fontSize * 0.3),
          y: height / 2,
          size: fontSize,
          font,
          color: hexToRgb(color),
          opacity,
          rotate: degrees(rotation),
        });
      }
      const bytes = await doc.save();
      downloadBytes(bytes, `watermarked-${file.name}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Watermark PDF</h1>
      <p className="text-zinc-500 mb-8">Add text watermark to all pages. Customize opacity, rotation, color.</p>

      {!file ? (
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to add watermark</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium">{file.name} • {formatSize(file.size)}</p>
            <button onClick={() => setFile(null)} className="px-3 py-1 bg-zinc-100 rounded-lg text-sm">Change</button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-sm font-medium">Watermark text</label>
              <input value={text} onChange={e => setText(e.target.value)} className="mt-2 w-full px-4 py-3 border border-zinc-200 rounded-xl text-lg font-bold" placeholder="CONFIDENTIAL" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Font size: {fontSize}px</label>
                <input type="range" min={10} max={120} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Opacity: {opacity}</label>
                <input type="range" min={0.1} max={1} step={0.1} value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Rotation: {rotation}°</label>
                <input type="range" min={0} max={360} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-lg" />
                  <span className="text-sm font-mono">{color}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Preview</p>
              <div className="h-32 flex items-center justify-center bg-white rounded-lg border border-dashed border-zinc-200 relative overflow-hidden">
                <span style={{ fontSize: `${Math.min(fontSize, 40)}px`, color, opacity, transform: `rotate(${rotation}deg)` }} className="font-bold select-none">{text || 'WATERMARK'}</span>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

            <button onClick={apply} disabled={isProcessing} className="w-full py-4 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Applying...</> : <><Droplets className="w-5 h-5" /> Add Watermark & Download</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
