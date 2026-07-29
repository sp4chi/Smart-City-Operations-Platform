import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { queryAIAssistant } from '../services/api';
import { Sparkles, Send, X, Bot, User, Database, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: string;
  sources?: string[];
}

export const OperationsChat: React.FC = () => {
  const { isChatDrawerOpen, setIsChatDrawerOpen } = useApp();
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your **CityPulse Operations AI Assistant** grounded in live city database metrics. How can I assist you with city operations today?",
      timestamp: new Date().toLocaleTimeString(),
      sources: ['Live DB Engine', 'Gemini RAG Pipeline']
    }
  ]);

  const quickPrompts = [
    "Which districts have water anomalies right now?",
    "Summarize active critical alerts",
    "What infrastructure assets are at high risk?",
    "Show 311 citizen request backlog"
  ];

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || prompt;
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      const res = await queryAIAssistant(messageText);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString(),
        mode: res.mode,
        sources: res.sources
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Error querying assistant:', e);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "I encountered an error querying live operations metrics. Please ensure the backend server is running.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isChatDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] glass-header border-l border-slate-800 shadow-2xl flex flex-col justify-between transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              City Operations Assistant
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                RAG Grounded
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Natural Language Insights & Live Database Summary</p>
          </div>
        </div>
        <button
          onClick={() => setIsChatDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                : 'glass-card bg-slate-900/90 text-slate-200 border-slate-800'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Database className="w-3 h-3 text-cyan-400" /> Grounded Context:
                  </span>
                  {msg.sources.map((src, idx) => (
                    <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                      {src}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-[9px] opacity-60 text-right">
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="glass-card p-3 text-slate-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Executing SQL DB lookup & generating grounded operational summary...
            </div>
          </div>
        )}
      </div>

      {/* Recommended Quick Action Chips */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Suggested Operational Queries:</p>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all text-left"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant about district metrics, alerts, assets..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
