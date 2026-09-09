import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FilePlus, GripVertical, X, Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { formatSize, downloadBytes } from '../lib/pdfUtils';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: string;
  pageCount?: number;
}

export default function MergeTool() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: File[]) => {
    const newFiles: PDFFile[] = [];
    for (const f of fileList.filter(f => f.type === 'application/pdf')) {
      let pages = undefined;
      try {
        const ab = await f.arrayBuffer();
        const doc = await PDFDocument.load(ab);
        pages = doc.getPageCount();
      } catch {}
      newFiles.push({
        id: Math.random().toString(36).substring(7),
        file: f,
        name: f.name,
        size: formatSize(f.size),
        pageCount: pages
      });
    }
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
    setSuccess(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) handleFiles(Array.from(e.dataTransfer.files));
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Please add at least two PDFs to merge.");
      return;
    }
    setIsMerging(true);
    setError(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const pdfFile of files) {
        const ab = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(ab);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      downloadBytes(bytes, 'merged.pdf');
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to merge. Ensure all files are valid PDFs.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Merge PDF</h1>
        <p className="text-zinc-500 mt-2">Combine multiple PDFs into one document. Drag to reorder.</p>
      </div>

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="group bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all"
      >
        <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={onFileChange} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <FilePlus className="w-7 h-7" />
          </div>
          <div>
            <p className="font-medium">Drop PDFs here or click to browse</p>
            <p className="text-sm text-zinc-500">Supports multiple files</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Files ({files.length})</h3>
          {files.length > 0 && (
            <button onClick={() => setFiles([])} className="text-xs flex items-center gap-1 text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Clear</button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-8 text-center text-zinc-400 italic">No files yet</div>
        ) : (
          <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
            <AnimatePresence>
              {files.map(f => (
                <Reorder.Item key={f.id} value={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3 shadow-sm cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-zinc-300" />
                  <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-zinc-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-zinc-500">{f.size} {f.pageCount ? `• ${f.pageCount} pages` : ''}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter(x => x.id !== f.id)); }} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {error && <div className="w-full bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
        {success && <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl">Merged PDF downloaded!</div>}
        <button disabled={files.length < 2 || isMerging} onClick={mergePDFs} className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-2 ${files.length < 2 || isMerging ? 'bg-zinc-200 text-zinc-400' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg'}`}>
          {isMerging ? <><Loader2 className="w-5 h-5 animate-spin" /> Merging...</> : <><Download className="w-5 h-5" /> Merge PDFs</>}
        </button>
      </div>
    </div>
  );
}
