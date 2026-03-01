import React, { useState, useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { File, Folder, ChevronRight, ChevronDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export default function SourceViewer() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        if (data.length > 0) {
          // Select App.tsx by default if it exists
          const defaultFile = data.find((f: string) => f.endsWith("App.tsx")) || data[0];
          setSelectedFile(defaultFile);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedFile) {
      setLoading(true);
      fetch(`/api/file-content?path=${encodeURIComponent(selectedFile)}`)
        .then((res) => res.json())
        .then((data) => {
          setFileContent(data.content);
          setLoading(false);
        });
    }
  }, [selectedFile]);

  const getLanguage = (filename: string) => {
    const ext = filename.split(".").pop();
    switch (ext) {
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "css":
        return "css";
      case "json":
        return "json";
      case "html":
        return "xml";
      default:
        return "text";
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-zinc-300 font-mono flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#252526]">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100 uppercase tracking-widest">
            Source Code Viewer
          </h1>
        </div>
        {selectedFile && (
          <div className="text-xs text-zinc-500 font-sans">
            Viewing: <span className="text-emerald-400">{selectedFile}</span>
          </div>
        )}
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800 bg-[#252526] overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
              Project Files
            </h2>
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2 ${
                    selectedFile === file
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <File className="w-3.5 h-3.5" />
                  <span className="truncate">{file}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow overflow-auto bg-[#1e1e1e] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <SyntaxHighlighter
              language={selectedFile ? getLanguage(selectedFile) : "typescript"}
              style={atomOneDark}
              customStyle={{
                margin: 0,
                padding: "2rem",
                fontSize: "13px",
                lineHeight: "1.6",
                backgroundColor: "transparent",
              }}
              showLineNumbers
            >
              {fileContent}
            </SyntaxHighlighter>
          )}
        </main>
      </div>
    </div>
  );
}
