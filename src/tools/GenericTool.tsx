import React, { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Upload, Download, Loader2, Trash2, FileText, Scissors, Crop, Shield, Unlock, Wrench, Info, RotateCw, Copy, Hash } from 'lucide-react';
import { downloadBytes, formatSize, parsePageRanges } from '../lib/pdfUtils';
import { PdfPageThumbnail } from '../components/PdfThumbnail';

type ToolType = 'delete' | 'extract' | 'crop' | 'protect' | 'unlock' | 'repair' | 'info' | 'reverse' | 'duplicate';

export default function GenericTool({ type }: { type: ToolType }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [rangeInput, setRangeInput] = useState('1-3,5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File, pwd?: string) => {
    if (f.type !== 'application/pdf') { setError('PDF only'); return; }
    setFile(f);
    setError(null);
    setInfo(null);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true, password: pwd } as any);
      setPageCount(doc.getPageCount());
      // extract info
      const title = (doc as any).getTitle?.() || 'Untitled';
      setInfo({ title, pages: doc.getPageCount(), size: formatSize(f.size) });
    } catch (e: any) {
      if (e.message?.includes('password') || e.message?.includes('encrypted')) {
        setError('PDF is password protected. Enter password to unlock.');
      } else {
        setError('Failed to load: ' + e.message);
      }
    }
  };

  const togglePage = (idx: number) => {
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx].sort((a, b) => a - b));
  };

  const process = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const ab = await file.arrayBuffer();
      const src = await PDFDocument.load(ab, { ignoreEncryption: true, password: password || undefined } as any);
      let out: PDFDocument | null = null;
      let bytes: Uint8Array | null = null;

      if (type === 'delete') {
        const toKeep = src.getPageIndices().filter(i => !selected.includes(i));
        if (toKeep.length === 0) throw new Error('Cannot delete all pages');
        out = await PDFDocument.create();
        const pages = await out.copyPages(src, toKeep);
        pages.forEach(p => out!.addPage(p));
        bytes = await out.save();
        downloadBytes(bytes, `deleted-${file.name}`);
      } else if (type === 'extract') {
        const indices = rangeInput ? parsePageRanges(rangeInput, pageCount) : selected;
        if (indices.length === 0) throw new Error('No pages selected');
        out = await PDFDocument.create();
        const pages = await out.copyPages(src, indices);
        pages.forEach(p => out!.addPage(p));
        bytes = await out.save();
        downloadBytes(bytes, `extracted-${file.name}`);
      } else if (type === 'reverse') {
        out = await PDFDocument.create();
        const indices = src.getPageIndices().reverse();
        const pages = await out.copyPages(src, indices);
        pages.forEach(p => out!.addPage(p));
        bytes = await out.save();
        downloadBytes(bytes, `reversed-${file.name}`);
      } else if (type === 'duplicate') {
        out = await PDFDocument.create();
        const indices = [...src.getPageIndices(), ...src.getPageIndices()];
        const pages = await out.copyPages(src, indices);
        pages.forEach(p => out!.addPage(p));
        bytes = await out.save();
        downloadBytes(bytes, `duplicated-${file.name}`);
      } else if (type === 'crop') {
        out = await PDFDocument.create();
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => {
          const { width, height } = p.getSize();
          // crop 10% margins as example - user can adjust via selected?
          const margin = 20;
          p.setCropBox(margin, margin, width - margin * 2, height - margin * 2);
          out!.addPage(p);
        });
        bytes = await out.save();
        downloadBytes(bytes, `cropped-${file.name}`);
      } else if (type === 'repair') {
        // Try to repair by reloading and resaving
        out = await PDFDocument.create();
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out!.addPage(p));
        bytes = await out.save();
        downloadBytes(bytes, `repaired-${file.name}`);
      } else if (type === 'unlock') {
        // Save without encryption
        out = await PDFDocument.create();
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out!.addPage(p));
        bytes = await out.save();
        downloadBytes(bytes, `unlocked-${file.name}`);
      } else if (type === 'protect') {
        // pdf-lib doesn't support encryption, so we simulate by saving and informing user
        // We'll still save the file and add metadata indicating protection
        src.setTitle(`Protected - Password: ${password}`);
        bytes = await src.save();
        downloadBytes(bytes, `protected-${file.name}`);
        setError(null);
        alert(`Note: True PDF encryption requires server-side processing. This demo saves the PDF with password metadata "${password}" embedded. For production, integrate a server library like qpdf or use PDF encryption service. The file downloaded is not encrypted but demonstrates the workflow.`);
        return;
      } else if (type === 'info') {
        // already handled
        return;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const titles: Record<ToolType, { title: string; desc: string; icon: any }> = {
    delete: { title: 'Delete Pages', desc: 'Remove selected pages from PDF', icon: Trash2 },
    extract: { title: 'Extract Pages', desc: 'Extract specific pages into new PDF', icon: Scissors },
    crop: { title: 'Crop PDF', desc: 'Crop margins and adjust page boxes', icon: Crop },
    protect: { title: 'Protect PDF', desc: 'Add password protection (demo)', icon: Shield },
    unlock: { title: 'Unlock PDF', desc: 'Remove password from protected PDF', icon: Unlock },
    repair: { title: 'Repair PDF', desc: 'Try to repair damaged PDF', icon: Wrench },
    info: { title: 'PDF Info', desc: 'View metadata and details', icon: Info },
    reverse: { title: 'Reverse Pages', desc: 'Reverse page order', icon: RotateCw },
    duplicate: { title: 'Duplicate Pages', desc: 'Duplicate all pages', icon: Copy },
  };

  const cfg = titles[type];
  const Icon = cfg.icon;

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Icon className="w-8 h-8" /> {cfg.title}</h1>
        <p className="text-zinc-500 mb-8">{cfg.desc}</p>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icon className="w-6 h-6" /> {cfg.title}: {file.name}</h1>
          <p className="text-sm text-zinc-500">{pageCount} pages • {formatSize(file.size)}</p>
        </div>
        <button onClick={() => { setFile(null); setSelected([]); setInfo(null); }} className="px-4 py-2 bg-zinc-100 rounded-xl text-sm">Change file</button>
      </div>

      {info && type === 'info' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Document Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-zinc-500">File name:</span> <span className="font-medium">{file.name}</span></div>
            <div><span className="text-zinc-500">File size:</span> <span className="font-medium">{info.size}</span></div>
            <div><span className="text-zinc-500">Pages:</span> <span className="font-medium">{pageCount}</span></div>
            <div><span className="text-zinc-500">Title:</span> <span className="font-medium">{info.title || 'N/A'}</span></div>
          </div>
        </div>
      )}

      {(type === 'delete' || type === 'extract') && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          {type === 'extract' && (
            <div className="mb-4">
              <label className="text-sm font-medium">Extract by range (e.g. 1-3,5,8-10)</label>
              <input value={rangeInput} onChange={e => setRangeInput(e.target.value)} className="mt-2 w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-sm" placeholder="1-3, 5, 8-10" />
              <p className="text-xs text-zinc-500 mt-1">Or select pages visually below. Range input takes priority if not empty.</p>
            </div>
          )}
          <h3 className="font-semibold mb-3">Select pages {type === 'delete' ? 'to delete' : 'to extract'} (click to toggle)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto">
            {Array.from({ length: pageCount }, (_, i) => (
              <div key={i} onClick={() => togglePage(i)} className={`cursor-pointer border-2 rounded-xl p-2 transition-all ${selected.includes(i) ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                <PdfPageThumbnail file={file} pageIndex={i} width={120} className="mx-auto mb-2" />
                <div className="text-center">
                  <p className="text-xs font-mono">Page {i + 1}</p>
                  <p className="text-[10px] mt-1">{selected.includes(i) ? (type === 'delete' ? 'Marked for deletion' : 'Selected') : 'Click to select'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(type === 'protect' || type === 'unlock') && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="text-sm font-medium">{type === 'protect' ? 'Set password' : 'Enter current password'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full px-4 py-3 border border-zinc-200 rounded-xl" placeholder="••••••••" />
            {type === 'protect' && <p className="text-xs text-zinc-500 mt-2">Note: Client-side encryption demo. True PDF encryption needs server-side qpdf or similar. This will embed password in metadata for demonstration.</p>}
            {type === 'unlock' && <p className="text-xs text-zinc-500 mt-2">If PDF is encrypted, enter password and we will try to unlock and resave without password.</p>}
          </div>
          {type === 'unlock' && (
            <button onClick={() => handleFile(file, password)} className="px-4 py-2 bg-zinc-100 rounded-xl text-sm">Try unlock with password</button>
          )}
        </div>
      )}

      {type === 'crop' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-2">Crop PDF</h3>
          <p className="text-sm text-zinc-500 mb-4">This tool crops 20px margins from all sides as a demo. For precise cropping, a visual editor would be needed. Click process to apply.</p>
          <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-8 text-center">
            <Crop className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
            <p className="text-sm">All pages will be cropped by 20px on each side</p>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}

      {type !== 'info' && (
        <button onClick={process} disabled={isProcessing || (['delete', 'extract'].includes(type) && selected.length === 0 && !rangeInput)} className="w-full py-4 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
          {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Download className="w-5 h-5" /> {cfg.title} & Download</>}
        </button>
      )}
    </div>
  );
}
