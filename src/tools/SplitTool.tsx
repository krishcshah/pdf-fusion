import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Scissors, Download, Loader2, FileText } from 'lucide-react';
import { formatSize, downloadBytes, parsePageRanges } from '../lib/pdfUtils';

export default function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<'single' | 'range' | 'custom'>('single');
  const [customRanges, setCustomRanges] = useState('1-2, 3-5');
  const [rangeSize, setRangeSize] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF'); return; }
    setFile(f);
    setError(null);
    setResults([]);
    try {
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab);
      setPageCount(doc.getPageCount());
    } catch (e) {
      setError('Invalid PDF file');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const split = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setResults([]);
    try {
      const ab = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(ab);
      const total = srcDoc.getPageCount();
      const outputs: { name: string; bytes: Uint8Array }[] = [];

      if (mode === 'single') {
        for (let i = 0; i < total; i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          outputs.push({ name: `page-${i + 1}.pdf`, bytes });
        }
      } else if (mode === 'range') {
        const size = Math.max(1, rangeSize);
        for (let start = 0; start < total; start += size) {
          const end = Math.min(start + size - 1, total - 1);
          const indices = Array.from({ length: end - start + 1 }, (_, k) => start + k);
          const newDoc = await PDFDocument.create();
          const pages = await newDoc.copyPages(srcDoc, indices);
          pages.forEach(p => newDoc.addPage(p));
          const bytes = await newDoc.save();
          outputs.push({ name: `pages-${start + 1}-${end + 1}.pdf`, bytes });
        }
      } else {
        const indices = parsePageRanges(customRanges, total);
        if (indices.length === 0) throw new Error('No valid pages in range');
        // Split custom ranges by comma groups
        const groups = customRanges.split(',').map(s => s.trim()).filter(Boolean);
        for (const g of groups) {
          const idxs = parsePageRanges(g, total);
          if (idxs.length === 0) continue;
          const newDoc = await PDFDocument.create();
          const pages = await newDoc.copyPages(srcDoc, idxs);
          pages.forEach(p => newDoc.addPage(p));
          const bytes = await newDoc.save();
          outputs.push({ name: `extract-${g.replace(/[^0-9-]/g, '_')}.pdf`, bytes });
        }
      }

      setResults(outputs);
      if (outputs.length === 1) {
        downloadBytes(outputs[0].bytes, outputs[0].name);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to split PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Split PDF</h1>
        <p className="text-zinc-500 mt-2">Separate one PDF into multiple files by pages or ranges.</p>
      </div>

      {!file ? (
        <div onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-zinc-400">
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
            <p className="font-medium">Drop PDF here or click to browse</p>
            <p className="text-sm text-zinc-500">{formatSize(0)} max - 100% private, browser-side</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-zinc-500">{formatSize(file.size)} • {pageCount} pages</p>
            </div>
            <button onClick={() => { setFile(null); setResults([]); }} className="text-xs px-3 py-1 bg-zinc-100 rounded-lg">Change</button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Split mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button onClick={() => setMode('single')} className={`p-4 rounded-xl border text-left ${mode === 'single' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-300'}`}>
                <p className="font-medium text-sm">Split by pages</p>
                <p className={`text-xs mt-1 ${mode === 'single' ? 'text-zinc-300' : 'text-zinc-500'}`}>Each page as separate PDF</p>
              </button>
              <button onClick={() => setMode('range')} className={`p-4 rounded-xl border text-left ${mode === 'range' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-300'}`}>
                <p className="font-medium text-sm">Split by range</p>
                <p className={`text-xs mt-1 ${mode === 'range' ? 'text-zinc-300' : 'text-zinc-500'}`}>Fixed number of pages</p>
              </button>
              <button onClick={() => setMode('custom')} className={`p-4 rounded-xl border text-left ${mode === 'custom' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-300'}`}>
                <p className="font-medium text-sm">Custom ranges</p>
                <p className={`text-xs mt-1 ${mode === 'custom' ? 'text-zinc-300' : 'text-zinc-500'}`}>e.g. 1-3, 5, 8-10</p>
              </button>
            </div>

            {mode === 'range' && (
              <div className="mb-4">
                <label className="text-sm font-medium">Pages per file</label>
                <input type="number" min={1} max={pageCount} value={rangeSize} onChange={e => setRangeSize(parseInt(e.target.value) || 1)} className="mt-2 w-32 px-3 py-2 border border-zinc-200 rounded-lg" />
              </div>
            )}
            {mode === 'custom' && (
              <div className="mb-4">
                <label className="text-sm font-medium">Custom ranges (e.g. 1-2, 3, 5-7)</label>
                <input type="text" value={customRanges} onChange={e => setCustomRanges(e.target.value)} className="mt-2 w-full px-3 py-2 border border-zinc-200 rounded-lg font-mono text-sm" placeholder="1-3, 5, 8-10" />
                <p className="text-xs text-zinc-500 mt-2">Total pages: {pageCount}. Example: 1-3 will extract pages 1 to 3 into one file.</p>
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>}

            <button onClick={split} disabled={isProcessing} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Splitting...</> : <><Scissors className="w-5 h-5" /> Split PDF</>}
            </button>
          </div>

          {results.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Results ({results.length} files)</h3>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                    <span className="text-sm font-mono">{r.name} • {formatSize(r.bytes.length)}</span>
                    <button onClick={() => downloadBytes(r.bytes, r.name)} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs flex items-center gap-1 hover:bg-zinc-900 hover:text-white"><Download className="w-3 h-3" /> Download</button>
                  </div>
                ))}
              </div>
              {results.length > 1 && (
                <button onClick={() => results.forEach(r => downloadBytes(r.bytes, r.name))} className="mt-4 w-full py-2 bg-zinc-100 rounded-xl text-sm font-medium hover:bg-zinc-200">Download All</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
