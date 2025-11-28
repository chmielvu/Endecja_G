import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, Bot, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatSidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, chatHistory, sendMessageToDmowski, status } = useStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'chatting') return;
    const msg = input;
    setInput('');
    await sendMessageToDmowski(msg);
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-0 top-14 bottom-0 w-96 bg-card border-l border-border shadow-2xl z-20 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sepia-900 border-2 border-primary overflow-hidden flex items-center justify-center bg-zinc-800">
                <span className="font-serif text-lg text-primary font-bold">RD</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground">Roman Dmowski</h3>
                <p className="text-xs text-muted-foreground font-mono">1925 • Warszawa</p>
              </div>
            </div>
            <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50" ref={scrollRef}>
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center border border-primary/30">
                     <Bot className="w-4 h-4 text-primary" />
                   </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-secondary text-secondary-foreground border border-secondary/50'
                      : 'bg-muted text-muted-foreground border border-border font-serif'
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'user' && (
                   <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-zinc-700">
                     <User className="w-4 h-4 text-zinc-400" />
                   </div>
                )}
              </div>
            ))}
            {status === 'chatting' && (
              <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                     <Bot className="w-4 h-4 text-primary animate-pulse" />
                   </div>
                 <div className="bg-muted border border-border rounded-lg p-3 text-sm text-muted-foreground">
                   <span className="animate-pulse">Piszę...</span>
                 </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Zapytaj o sprawy narodu..."
                className="w-full bg-zinc-900 border border-input rounded-md pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-zinc-600"
                disabled={status === 'chatting'}
              />
              <button
                type="submit"
                disabled={!input.trim() || status === 'chatting'}
                className="absolute right-2 top-2 p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
