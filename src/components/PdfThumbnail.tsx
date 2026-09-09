import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface Props {
  file: File;
  pageIndex: number; // 0-based
  width?: number;
  className?: string;
}

export function PdfPageThumbnail({ file, pageIndex, width = 160, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        setLoading(true);
        setError(null);
        const ab = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: ab }).promise;
        if (cancelled) return;
        if (pageIndex >= doc.numPages) {
          setError('Invalid page');
          setLoading(false);
          return;
        }
        const page = await doc.getPage(pageIndex + 1);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas } as any).promise;
        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to render');
          setLoading(false);
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [file, pageIndex, width]);

  return (
    <div className={`relative bg-white rounded-lg overflow-hidden shadow-sm border border-zinc-200 ${className}`} style={{ width }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="p-4 text-xs text-red-500">{error}</div>
      )}
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>
  );
}

export function usePdfJsDoc(file: File | null) {
  const [doc, setDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDoc(null);
      setNumPages(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const ab = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: ab }).promise;
        if (cancelled) return;
        setDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [file]);

  return { doc, numPages, loading, error };
}
