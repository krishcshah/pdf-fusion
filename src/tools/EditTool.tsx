import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Upload, Type, Image as ImageIcon, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

interface TextAnnotation {
  id: string;
  page: number;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function EditTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [newText, setNewText] = useState('Hello PDF!');
  const [selectedPage, setSelectedPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      setPageCount(doc.getPageCount());
      setAnnotations([]);
    } catch (e: any) { setError(e.message); }
  };

  const addText = () => {
    const ann: TextAnnotation = {
      id: Math.random().toString(36).substring(7),
      page: selectedPage,
      text: newText,
      x: 50,
      y: 700,
      size: 18,
      color: '#000000'
    };
    setAnnotations(prev => [...prev, ann]);
  };

  const updateAnn = (id: string, patch: Partial<TextAnnotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const removeAnn = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const save = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      for (const ann of annotations) {
        if (ann.page >= pages.length) continue;
        const page = pages[ann.page];
        const { height } = page.getSize();
        const r = parseInt(ann.color.slice(1, 3), 16) / 255;
        const g = parseInt(ann.color.slice(3, 5), 16) / 255;
        const b = parseInt(ann.color.slice(5, 7), 16) / 255;
        page.drawText(ann.text, {
          x: ann.x,
          y: height - ann.y,
          size: ann.size,
          font,
          color: rgb(r, g, b)
        });
      }
      const bytes = await doc.save();
      downloadBytes(bytes, `edited-${file.name}`);
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Edit PDF</h1>
      <p className="text-zinc-500 mb-8">Add text to any page. Position, size, color customization.</p>

      {!file ? (
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="max-w-3xl mx-auto bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF to edit</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Document</h3>
                <button onClick={() => setFile(null)} className="text-xs px-2 py-1 bg-zinc-100 rounded">Change</button>
              </div>
              <p className="text-sm">{file.name}</p>
              <p className="text-xs text-zinc-500">{formatSize(file.size)} • {pageCount} pages</p>
              <div className="mt-4">
                <label className="text-xs font-semibold">Current page: {selectedPage + 1}</label>
                <input type="range" min={0} max={Math.max(0, pageCount - 1)} value={selectedPage} onChange={e => setSelectedPage(Number(e.target.value))} className="w-full mt-1" />
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Type className="w-4 h-4" /> Add Text</h3>
              <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="Enter text" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm mb-3" />
              <button onClick={addText} className="w-full py-2 bg-zinc-900 text-white rounded-lg text-sm flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Add to page {selectedPage + 1}</button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Annotations ({annotations.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {annotations.length === 0 && <p className="text-xs text-zinc-500">No text added yet</p>}
                {annotations.map(a => (
                  <div key={a.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono">Page {a.page + 1}</span>
                      <button onClick={() => removeAnn(a.id)} className="w-5 h-5 bg-white border rounded flex items-center justify-center hover:bg-red-50 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <input value={a.text} onChange={e => updateAnn(a.id, { text: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px]">X</label>
                        <input type="number" value={a.x} onChange={e => updateAnn(a.id, { x: Number(e.target.value) })} className="w-full px-1 py-1 border rounded text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px]">Y</label>
                        <input type="number" value={a.y} onChange={e => updateAnn(a.id, { y: Number(e.target.value) })} className="w-full px-1 py-1 border rounded text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px]">Size</label>
                        <input type="number" value={a.size} onChange={e => updateAnn(a.id, { size: Number(e.target.value) })} className="w-full px-1 py-1 border rounded text-xs" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={a.color} onChange={e => updateAnn(a.id, { color: e.target.value })} className="w-6 h-6 rounded" />
                      <span className="text-xs font-mono">{a.color}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
            <button onClick={save} disabled={isProcessing || annotations.length === 0} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Download className="w-5 h-5" /> Download Edited PDF</>}
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Preview - Page {selectedPage + 1}</h3>
              <div className="aspect-[1/1.4] bg-zinc-50 border border-zinc-200 rounded-xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-4 bg-white shadow-sm border border-zinc-100 p-4">
                  <div className="text-[10px] text-zinc-400">PDF Content Preview (page {selectedPage + 1})</div>
                  <div className="mt-8 space-y-2">
                    <div className="h-3 bg-zinc-100 rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-100 rounded w-full"></div>
                    <div className="h-3 bg-zinc-100 rounded w-5/6"></div>
                  </div>
                  {annotations.filter(a => a.page === selectedPage).map(a => (
                    <div key={a.id} style={{ left: `${(a.x / 600) * 100}%`, top: `${(a.y / 800) * 100}%`, fontSize: `${a.size * 0.6}px`, color: a.color }} className="absolute font-medium select-none">
                      {a.text}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-3">Note: This is a schematic preview. Actual text will be rendered precisely in final PDF using pdf-lib.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
