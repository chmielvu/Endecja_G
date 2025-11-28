import React, { useEffect, useRef } from 'react';
import { useStore } from './lib/store';
import GraphCanvas from './components/GraphCanvas';
import ChatSidebar from './components/ChatSidebar';
import { BrainCircuit, Upload, MessageSquareText, Network } from 'lucide-react';

const App: React.FC = () => {
  const { init, toggleSidebar, analyzeAndExpandGraph, setUploadedText, status, isSidebarOpen } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setUploadedText(text);
    // Auto-analyze after upload in this agentic flow
    await analyzeAndExpandGraph();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg shadow-primary/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-xl tracking-tight leading-none text-white">
              ENDECJA<span className="text-primary ml-0.5">KG</span>
            </h1>
            <span className="text-[10px] font-mono text-muted-foreground tracking-[0.2em] uppercase">Agentic Builder v2.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'analyzing'}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Wczytaj Źródła (TXT)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt,.md,.json"
            onChange={handleFileUpload}
          />

          <button
            onClick={analyzeAndExpandGraph}
            disabled={status === 'analyzing'}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-all border ${
              status === 'analyzing' 
                ? 'bg-accent/20 border-accent/50 text-accent animate-pulse' 
                : 'bg-accent hover:bg-accent/90 border-accent text-white shadow-lg shadow-accent/20'
            }`}
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${status === 'analyzing' ? 'animate-spin' : ''}`} />
            <span>{status === 'analyzing' ? 'Analiza w toku...' : 'Analiza i Rozwój Grafu'}</span>
          </button>

          <div className="h-6 w-px bg-border mx-1" />

          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded transition-colors ${
              isSidebarOpen 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Rozmowa z Dmowskim</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-br from-background to-zinc-900">
        <GraphCanvas />
        <ChatSidebar />
        
        {/* Status Toast */}
        {status === 'updating' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-900/80 border border-emerald-500/50 text-emerald-100 text-xs font-mono rounded-full backdrop-blur flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Graf zaktualizowany – 7 metryk centralności obliczonych
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
