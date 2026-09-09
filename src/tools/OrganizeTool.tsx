import React, { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Upload, RotateCw, Trash2, Download, Loader2, GripVertical, FileText } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { PdfPageThumbnail } from '../components/PdfThumbnail';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number; // 0,90,180,270
  deleted: boolean;
}

export default function OrganizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Upload PDF only'); return; }
    setFile(f);
    setError(null);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const count = doc.getPageCount();
      setPages(Array.from({ length: count }, (_, i) => ({
        id: `${i}-${Math.random()}`,
        originalIndex: i,
        rotation: 0,
        deleted: false
      })));
    } catch (e: any) {
      setError('Failed to load PDF: ' + e.message);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const rotatePage = (id: string, deg: number) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + deg) % 360 } : p));
  };

  const toggleDelete = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, deleted: !p.deleted } : p));
  };

  const save = async () => {
    if (!file) return;
    const active = pages.filter(p => !p.deleted);
    if (active.length === 0) { setError('No pages to save'); return; }
    setIsProcessing(true);
    setError(null);
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab);
      const out = await PDFDocument.create();
      for (const p of active) {
        const [copied] = await out.copyPages(src, [p.originalIndex]);
        copied.setRotation(degrees(p.rotation));
        out.addPage(copied);
      }
      const bytes = await out.save();
      downloadBytes(bytes, `organized-${file.name}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Organize PDF</h1>
        <p className="text-zinc-500 mb-8">Rearrange, rotate, and delete pages visually.</p>
        <div onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to organize</p>
            <p className="text-sm text-zinc-500">Drag & drop reordering, rotate, delete</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Organize: {file.name}</h1>
          <p className="text-sm text-zinc-500">{pages.length} pages • {pages.filter(p => p.deleted).length} marked for deletion • Drag to reorder</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setFile(null); setPages([]); }} className="px-4 py-2 bg-zinc-100 rounded-xl text-sm">Change file</button>
          <button onClick={save} disabled={isProcessing} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save PDF
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}

      <Reorder.Group axis="x" values={pages} onReorder={setPages} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {pages.map(p => (
          <Reorder.Item key={p.id} value={p} className={`group relative bg-white border rounded-2xl p-3 shadow-sm ${p.deleted ? 'border-red-200 bg-red-50 opacity-60' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono bg-zinc-100 px-2 py-0.5 rounded">#{p.originalIndex + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => rotatePage(p.id, 90)} className="w-6 h-6 bg-zinc-100 hover:bg-zinc-200 rounded flex items-center justify-center"><RotateCw className="w-3 h-3" /></button>
                <button onClick={() => toggleDelete(p.id)} className={`w-6 h-6 rounded flex items-center justify-center ${p.deleted ? 'bg-emerald-500 text-white' : 'bg-zinc-100 hover:bg-red-100 hover:text-red-600'}`}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="relative" style={{ transform: `rotate(${p.rotation}deg)`, transformOrigin: 'center' }}>
              <PdfPageThumbnail file={file} pageIndex={p.originalIndex} width={180} className="mx-auto" />
              {p.deleted && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">Deleted</span></div>}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-zinc-300">
              <GripVertical className="w-4 h-4" />
              <span className="text-xs">{p.rotation}°</span>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="mt-8 bg-zinc-900 text-white rounded-2xl p-6">
        <h3 className="font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-zinc-300 list-disc pl-5 space-y-1">
          <li>Drag cards to reorder pages</li>
          <li>Click rotate to rotate 90° clockwise</li>
          <li>Click trash to mark for deletion (click again to restore)</li>
          <li>Final PDF will have only non-deleted pages in displayed order</li>
        </ul>
      </div>
    </div>
  );
}
