# PDF Fusion 📄⚡ - All-in-One PDF Toolkit

Welcome to **PDF Fusion v2.0**, a complete client-side PDF toolkit inspired by Smallpdf & iLovePDF. Merge, split, edit, sign, compress, convert and more — 100% private, no server uploads.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features - 20+ Tools

### ORGANIZE
- **Merge PDF** - Combine multiple PDFs with drag-to-reorder
- **Split PDF** - Split by single pages, fixed ranges, or custom ranges (e.g. 1-3,5,8-10)
- **Organize PDF** - Visual rearrangement with thumbnails, rotate, delete (pdf.js rendering)
- **Rotate PDF** - Rotate individual or all pages 90°/180°/270°
- **Delete Pages** - Visually select pages to remove
- **Extract Pages** - Extract specific pages or ranges
- **Reverse / Duplicate** - Reverse order or duplicate pages

### EDIT
- **Edit PDF** - Add text annotations anywhere with position, size, color control
- **Sign PDF** - Draw signature on canvas, place with X/Y/scale control on any page
- **Watermark** - Text watermark with opacity, rotation, color, font-size
- **Page Numbers** - Add {n}, {n}/{total}, Page {n} formats, 5 positions
- **Crop PDF** - Crop margins via CropBox

### CONVERT
- **Images to PDF (JPG to PDF)** - Convert JPG/PNG/WEBP to PDF, A4 or fit, portrait/landscape, reorder
- **PDF to Images (PDF to JPG)** - Render each page to JPG/PNG via pdf.js at 1x/2x/3x quality
- **Compress PDF** - Structural optimization with low/medium/high levels, size comparison

### SECURITY
- **Protect PDF** - Password UI (demo: pdf-lib doesn't support encryption client-side, shows workflow)
- **Unlock PDF** - Load encrypted PDFs with password and resave unlocked

### EXTRA
- **Repair PDF** - Try to repair by reloading & resaving
- **PDF Info** - Metadata, page count, size

All tools work **100% client-side** using `pdf-lib` for manipulation and `pdfjs-dist` for rendering. No files leave your device.

## 🛠️ Tech Stack

- React 19, Vite 6, TailwindCSS 4
- pdf-lib 1.17 for PDF creation/editing
- pdfjs-dist 4.4 for rendering thumbnails & PDF to images
- Framer Motion for drag reorder
- Lucide React icons
- React Router for tool routing

## 🚀 Run Locally

```bash
git clone https://github.com/krishcshah/pdf-fusion.git
cd pdf-fusion
npm install
npm run dev
# open http://localhost:3000
```

## 📜 Scripts

- `npm run dev` - Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - tsc --noEmit
- `npm run clean` - rm -rf dist

## 🔒 Privacy

Unlike Smallpdf/iLovePDF, PDF Fusion never uploads your files. Everything runs in browser memory via ArrayBuffers and Blob URLs.

## 🤝 Contributing

PRs welcome! Check issues page.

---
<div align="center">
  <i>Built with ❤️ using React, pdf-lib, pdf.js. Inspired by Smallpdf & iLovePDF.</i>
</div>
