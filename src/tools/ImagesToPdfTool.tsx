import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Image as ImageIcon, Download, Loader2, X, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { downloadBytes, formatSize } from '../lib/pdfUtils';

interface ImgFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: string;
}

export default function ImagesToPdfTool() {
  const [images, setImages] = useState<ImgFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<'fit' | 'A4'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: File[]) => {
    const newImgs: ImgFile[] = fileList.filter(f => f.type.startsWith('image/')).map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      preview: URL.createObjectURL(f),
      name: f.name,
      size: formatSize(f.size)
    }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const convert = async () => {
    if (images.length === 0) { setError('Add at least one image'); return; }
    setIsProcessing(true);
    setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const img of images) {
        const ab = await img.file.arrayBuffer();
        let embedded;
        if (img.file.type === 'image/jpeg' || img.file.type === 'image/jpg') {
          embedded = await pdf.embedJpg(ab);
        } else if (img.file.type === 'image/png') {
          embedded = await pdf.embedPng(ab);
        } else {
          // try jpg first, fallback png
          try { embedded = await pdf.embedJpg(ab); } catch { embedded = await pdf.embedPng(ab); }
        }
        const { width, height } = embedded.scale(1);
        let page;
        if (pageSize === 'A4') {
          const a4Width = orientation === 'portrait' ? 595.28 : 841.89;
          const a4Height = orientation === 'portrait' ? 841.89 : 595.28;
          page = pdf.addPage([a4Width, a4Height]);
          // fit image centered
          const scale = Math.min((a4Width - 40) / width, (a4Height - 40) / height);
          const w = width * scale;
          const h = height * scale;
          page.drawImage(embedded, {
            x: (a4Width - w) / 2,
            y: (a4Height - h) / 2,
            width: w,
            height: h
          });
        } else {
          page = pdf.addPage([width, height]);
          page.drawImage(embedded, { x: 0, y: 0, width, height });
        }
      }
      const bytes = await pdf.save();
      downloadBytes(bytes, 'images-to-pdf.pdf');
    } catch (e: any) {
      setError(e.message || 'Failed to convert');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Images to PDF</h1>
      <p className="text-zinc-500 mb-8">Convert JPG, PNG images to PDF. Reorder, set page size.</p>

      <div onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()} className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center cursor-pointer hover:border-zinc-400">
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && handleFiles(Array.from(e.target.files))} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center"><Upload className="w-7 h-7" /></div>
          <p className="font-medium">Drop images here or click to browse</p>
          <p className="text-sm text-zinc-500">JPG, PNG, WEBP supported</p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Page size</label>
              <select value={pageSize} onChange={e => setPageSize(e.target.value as any)} className="ml-2 px-3 py-1 border border-zinc-200 rounded-lg text-sm">
                <option value="A4">A4</option>
                <option value="fit">Fit image</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Orientation</label>
              <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="ml-2 px-3 py-1 border border-zinc-200 rounded-lg text-sm">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <button onClick={() => setImages([])} className="ml-auto text-xs px-3 py-1 bg-zinc-100 rounded-lg">Clear all</button>
          </div>

          <Reorder.Group axis="y" values={images} onReorder={setImages} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map(img => (
              <Reorder.Item key={img.id} value={img} className="bg-white border border-zinc-200 rounded-xl overflow-hidden group">
                <div className="relative">
                  <img src={img.preview} alt={img.name} className="w-full h-40 object-cover" />
                  <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-600"><X className="w-4 h-4" /></button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1"><GripVertical className="w-3 h-3" /> Drag</div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{img.name}</p>
                  <p className="text-xs text-zinc-500">{img.size}</p>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

          <button onClick={convert} disabled={isProcessing} className="w-full py-4 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Converting...</> : <><ImageIcon className="w-5 h-5" /> Convert {images.length} images to PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}
