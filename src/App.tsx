import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FilePlus, Scissors, Layers, RotateCw, Trash2, FileOutput, Image as ImageIcon,
  FileImage, Zap, PenTool, Droplets, Hash, Crop, Shield, Unlock, Wrench, Info,
  ArrowLeftRight, Copy, Edit3, FileText, Sparkles, Search, Home, Menu, X, Github,
  Heart, ShieldCheck, ZapIcon, LayoutGrid, Files, Signature, Type, FileDown
} from 'lucide-react';
import { motion } from 'motion/react';

// Tools
import MergeTool from './tools/MergeTool';
import SplitTool from './tools/SplitTool';
import OrganizeTool from './tools/OrganizeTool';
import RotateTool from './tools/RotateTool';
import ImagesToPdfTool from './tools/ImagesToPdfTool';
import PdfToImagesTool from './tools/PdfToImagesTool';
import WatermarkTool from './tools/WatermarkTool';
import PageNumbersTool from './tools/PageNumbersTool';
import SignTool from './tools/SignTool';
import EditTool from './tools/EditTool';
import CompressTool from './tools/CompressTool';
import GenericTool from './tools/GenericTool';

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  category: 'Organize' | 'Edit' | 'Convert' | 'Security' | 'Extra';
  path: string;
  popular?: boolean;
};

const tools: Tool[] = [
  { id: 'merge', name: 'Merge PDF', description: 'Combine PDFs in order', icon: FilePlus, color: 'text-red-600', bg: 'bg-red-50', category: 'Organize', path: '/merge', popular: true },
  { id: 'split', name: 'Split PDF', description: 'Separate one PDF into many', icon: Scissors, color: 'text-orange-600', bg: 'bg-orange-50', category: 'Organize', path: '/split', popular: true },
  { id: 'organize', name: 'Organize PDF', description: 'Reorder, rotate, delete pages', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50', category: 'Organize', path: '/organize', popular: true },
  { id: 'rotate', name: 'Rotate PDF', description: 'Rotate pages permanently', icon: RotateCw, color: 'text-yellow-600', bg: 'bg-yellow-50', category: 'Organize', path: '/rotate' },
  { id: 'delete', name: 'Delete Pages', description: 'Remove pages from PDF', icon: Trash2, color: 'text-lime-600', bg: 'bg-lime-50', category: 'Organize', path: '/delete-pages' },
  { id: 'extract', name: 'Extract Pages', description: 'Extract pages to new PDF', icon: FileOutput, color: 'text-green-600', bg: 'bg-green-50', category: 'Organize', path: '/extract' },
  { id: 'reverse', name: 'Reverse PDF', description: 'Reverse page order', icon: ArrowLeftRight, color: 'text-emerald-600', bg: 'bg-emerald-50', category: 'Organize', path: '/reverse' },
  { id: 'duplicate', name: 'Duplicate Pages', description: 'Duplicate all pages', icon: Copy, color: 'text-teal-600', bg: 'bg-teal-50', category: 'Organize', path: '/duplicate' },

  { id: 'edit', name: 'Edit PDF', description: 'Add text, shapes, edits', icon: Edit3, color: 'text-blue-600', bg: 'bg-blue-50', category: 'Edit', path: '/edit', popular: true },
  { id: 'sign', name: 'Sign PDF', description: 'Draw signature & sign', icon: Signature, color: 'text-indigo-600', bg: 'bg-indigo-50', category: 'Edit', path: '/sign', popular: true },
  { id: 'watermark', name: 'Watermark', description: 'Add text watermark', icon: Droplets, color: 'text-violet-600', bg: 'bg-violet-50', category: 'Edit', path: '/watermark' },
  { id: 'page-numbers', name: 'Page Numbers', description: 'Add page numbering', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50', category: 'Edit', path: '/page-numbers' },
  { id: 'crop', name: 'Crop PDF', description: 'Crop margins & boxes', icon: Crop, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', category: 'Edit', path: '/crop' },

  { id: 'images-to-pdf', name: 'JPG to PDF', description: 'Images to PDF converter', icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-50', category: 'Convert', path: '/images-to-pdf', popular: true },
  { id: 'pdf-to-images', name: 'PDF to JPG', description: 'Convert PDF to images', icon: FileImage, color: 'text-rose-600', bg: 'bg-rose-50', category: 'Convert', path: '/pdf-to-images', popular: true },
  { id: 'compress', name: 'Compress PDF', description: 'Reduce file size', icon: Zap, color: 'text-red-500', bg: 'bg-red-50', category: 'Convert', path: '/compress', popular: true },

  { id: 'protect', name: 'Protect PDF', description: 'Password protect PDF', icon: Shield, color: 'text-slate-600', bg: 'bg-slate-50', category: 'Security', path: '/protect' },
  { id: 'unlock', name: 'Unlock PDF', description: 'Remove password', icon: Unlock, color: 'text-zinc-600', bg: 'bg-zinc-50', category: 'Security', path: '/unlock' },

  { id: 'repair', name: 'Repair PDF', description: 'Repair damaged PDF', icon: Wrench, color: 'text-orange-700', bg: 'bg-orange-50', category: 'Extra', path: '/repair' },
  { id: 'info', name: 'PDF Info', description: 'View PDF metadata', icon: Info, color: 'text-cyan-600', bg: 'bg-cyan-50', category: 'Extra', path: '/info' },
];

function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold text-lg">P</div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none">PDF Fusion</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">All-in-one PDF Tools</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className={`text-sm font-medium ${isHome ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>All Tools</Link>
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">100% Private • Browser-Side</span>
          <a href="https://github.com/krishcshah/pdf-fusion" target="_blank" className="w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center justify-center"><Github className="w-4 h-4" /></a>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 font-medium">All Tools</Link>
          <div className="text-xs px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">100% Private • Files never leave your device</div>
        </div>
      )}
    </header>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link to={tool.path} className="group relative bg-white border border-zinc-200 rounded-[20px] p-5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {tool.popular && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-zinc-900 text-white rounded-full uppercase tracking-widest">Popular</span>}
      <div className={`w-12 h-12 ${tool.bg} ${tool.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-[15px] leading-tight">{tool.name}</h3>
      <p className="text-[13px] text-zinc-500 mt-1 leading-snug flex-1">{tool.description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-900">
        <span>Open tool</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );
}

function Dashboard() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('All');

  const categories = ['All', 'Organize', 'Edit', 'Convert', 'Security', 'Extra'] as const;

  const filtered = tools.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || t.category === category;
    return matchSearch && matchCat;
  });

  const grouped = category === 'All' ? {
    Popular: tools.filter(t => t.popular),
    Organize: tools.filter(t => t.category === 'Organize' && !t.popular),
    Edit: tools.filter(t => t.category === 'Edit' && !t.popular),
    Convert: tools.filter(t => t.category === 'Convert' && !t.popular),
    Security: tools.filter(t => t.category === 'Security'),
    Extra: tools.filter(t => t.category === 'Extra'),
  } : null;

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-zinc-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto pt-8 pb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium shadow-sm mb-6">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>New: Full PDF Editor & Signature Tool Added</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Every tool you need to work with PDFs in one place
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-zinc-500 mt-4 text-lg leading-relaxed">
            Merge, split, compress, convert, rotate, unlock and watermark PDFs. All processing happens in your browser — 100% private, no uploads.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools (e.g. merge, sign, compress)" className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900" />
            </div>
          </motion.div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${category === c ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        {category === 'All' ? (
          <div className="space-y-12">
            {Object.entries(grouped!).map(([groupName, groupTools]) => (
              groupTools.length > 0 && (
                <div key={groupName}>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> {groupName} {groupName === 'Popular' && `• ${groupTools.length} tools`}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupTools.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())).map(tool => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              )
            ))}
            {search && filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-500">No tools found for "{search}"</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">{category} Tools • {filtered.length}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(tool => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 rounded-[24px] p-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck className="w-6 h-6" /></div>
            <h3 className="font-semibold">100% Private</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">All processing happens in your browser using pdf-lib & pdf.js. Files never leave your device, no server uploads, no tracking.</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-[24px] p-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><ZapIcon className="w-6 h-6" /></div>
            <h3 className="font-semibold">Lightning Fast</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">No waiting for uploads. Merge 100+ MB PDFs instantly. Works offline after first load. Optimized WASM rendering.</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-[24px] p-6">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><Files className="w-6 h-6" /></div>
            <h3 className="font-semibold">20+ Tools</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">From merging to signing, watermarking, page numbers, compression, conversion — everything Smallpdf & iLovePDF offer, free.</p>
          </div>
        </div>

        <div className="mt-16 bg-zinc-900 text-white rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Open source & free forever</h3>
            <p className="text-zinc-400 mt-2 max-w-xl">Built with React, pdf-lib, pdf.js. No ads, no limits, no watermarks. Contribute on GitHub.</p>
          </div>
          <a href="https://github.com/krishcshah/pdf-fusion" target="_blank" className="px-6 py-3 bg-white text-zinc-900 rounded-xl font-semibold flex items-center gap-2 hover:bg-zinc-100">
            <Github className="w-5 h-5" /> Star on GitHub
          </a>
        </div>
      </main>

      <footer className="border-t border-zinc-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
          <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Made by Krish Shah • PDF Fusion v2.0 • All tools client-side</div>
          <div className="flex items-center gap-4">
            <span>© 2026 PDF Fusion</span>
            <Link to="/info" className="hover:text-zinc-900">PDF Info</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ToolLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fcfcf9]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50">
          <Home className="w-4 h-4" /> All Tools
        </button>
        <div className="bg-[#fcfcf9]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/merge" element={<ToolLayout><MergeTool /></ToolLayout>} />
        <Route path="/split" element={<ToolLayout><SplitTool /></ToolLayout>} />
        <Route path="/organize" element={<ToolLayout><OrganizeTool /></ToolLayout>} />
        <Route path="/rotate" element={<ToolLayout><RotateTool /></ToolLayout>} />
        <Route path="/delete-pages" element={<ToolLayout><GenericTool type="delete" /></ToolLayout>} />
        <Route path="/extract" element={<ToolLayout><GenericTool type="extract" /></ToolLayout>} />
        <Route path="/reverse" element={<ToolLayout><GenericTool type="reverse" /></ToolLayout>} />
        <Route path="/duplicate" element={<ToolLayout><GenericTool type="duplicate" /></ToolLayout>} />
        <Route path="/images-to-pdf" element={<ToolLayout><ImagesToPdfTool /></ToolLayout>} />
        <Route path="/pdf-to-images" element={<ToolLayout><PdfToImagesTool /></ToolLayout>} />
        <Route path="/compress" element={<ToolLayout><CompressTool /></ToolLayout>} />
        <Route path="/edit" element={<ToolLayout><EditTool /></ToolLayout>} />
        <Route path="/sign" element={<ToolLayout><SignTool /></ToolLayout>} />
        <Route path="/watermark" element={<ToolLayout><WatermarkTool /></ToolLayout>} />
        <Route path="/page-numbers" element={<ToolLayout><PageNumbersTool /></ToolLayout>} />
        <Route path="/crop" element={<ToolLayout><GenericTool type="crop" /></ToolLayout>} />
        <Route path="/protect" element={<ToolLayout><GenericTool type="protect" /></ToolLayout>} />
        <Route path="/unlock" element={<ToolLayout><GenericTool type="unlock" /></ToolLayout>} />
        <Route path="/repair" element={<ToolLayout><GenericTool type="repair" /></ToolLayout>} />
        <Route path="/info" element={<ToolLayout><GenericTool type="info" /></ToolLayout>} />
        {/* Fallback for legacy /source */}
        <Route path="/source" element={<ToolLayout><GenericTool type="info" /></ToolLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
