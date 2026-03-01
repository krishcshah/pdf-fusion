/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  FilePlus, 
  GripVertical, 
  X, 
  Download, 
  FileText, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Code2,
  Heart
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SourceViewer from './components/SourceViewer';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

function PDFMerger() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      const newFiles: PDFFile[] = fileList
        .filter((file: File) => file.type === 'application/pdf')
        .map((file: File) => ({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          size: formatSize(file.size)
        }));
      
      setFiles(prev => [...prev, ...newFiles]);
      setMergedUrl(null);
      setError(null);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedUrl(null);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Please add at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfFile of files) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while merging the PDFs. Please ensure all files are valid PDFs.");
    } finally {
      setIsMerging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      const newFiles: PDFFile[] = fileList
        .filter((file: File) => file.type === 'application/pdf')
        .map((file: File) => ({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          size: formatSize(file.size)
        }));
      
      setFiles(prev => [...prev, ...newFiles]);
      setMergedUrl(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col">
      {/* Header */}
      <header className="max-w-4xl mx-auto pt-16 pb-8 px-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-zinc-900">
              PDF <span className="font-semibold">Fusion</span>
            </h1>
            <p className="text-zinc-500 mt-2 font-light">
              Merge multiple PDF documents into one. Drag to reorder.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Browser-Side Processing</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-24 flex-grow w-full">
        {/* Upload Area */}
        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="group relative bg-white border-2 border-dashed border-zinc-200 rounded-3xl p-12 text-center cursor-pointer transition-all hover:border-zinc-400 hover:bg-zinc-50/50"
        >
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FilePlus className="w-8 h-8 text-zinc-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-zinc-800">Drop PDFs here or click to browse</p>
              <p className="text-sm text-zinc-500 mt-1">Combine as many files as you need</p>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
              Documents ({files.length})
            </h2>
            {files.length > 0 && (
              <button 
                onClick={() => setFiles([])}
                className="text-xs font-medium text-zinc-500 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="bg-zinc-100/50 border border-zinc-200 rounded-2xl p-12 text-center">
              <p className="text-zinc-400 italic">No files selected yet</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-3">
              <AnimatePresence initial={false}>
                {files.map((file) => (
                  <Reorder.Item
                    key={file.id}
                    value={file}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                  >
                    <div className="text-zinc-300 group-hover:text-zinc-400 transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{file.name}</p>
                      <p className="text-xs text-zinc-400">{file.size}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-col items-center gap-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="flex flex-wrap justify-center gap-4 w-full">
            <button
              disabled={files.length < 2 || isMerging}
              onClick={mergePDFs}
              className={`
                flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
                ${files.length < 2 || isMerging 
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-[1.02] shadow-xl shadow-zinc-200 hover:shadow-zinc-300 active:scale-[0.98]'}
              `}
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Merging Documents...
                </>
              ) : (
                <>
                  Combine PDFs
                </>
              )}
            </button>

            {mergedUrl && (
              <motion.a
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                href={mergedUrl}
                download="merged_document.pdf"
                className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-semibold text-lg hover:bg-emerald-600 hover:scale-[1.02] shadow-xl shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 active:scale-[0.98]"
              >
                <Download className="w-6 h-6" />
                Download Merged PDF
              </motion.a>
            )}
          </div>

          {mergedUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-emerald-600 text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Success! Your PDF is ready.
            </motion.div>
          )}
        </div>
      </main>

      {/* Global Footer */}
      <footer className="w-full border-t border-zinc-200 bg-white/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
            <span>Made by Krish Shah ❤️</span>
          </div>
          <Link 
            to="/source" 
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-semibold transition-all active:scale-95"
          >
            <Code2 className="w-3.5 h-3.5" />
            View Source Code
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PDFMerger />} />
        <Route path="/source" element={<SourceViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

