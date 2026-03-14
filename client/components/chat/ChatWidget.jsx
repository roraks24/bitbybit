'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';

// ── Markdown-lite renderer ────────────────────────────────────
function FormattedMessage({ content }) {
  // Parse simple markdown: **bold**, `code`, bullet points, numbered lists
  const lines = content.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Empty line → spacer
        if (line.trim() === '') return <div key={i} className="h-1" />;

        // Format inline markdown
        let formatted = line;

        // Process inline patterns and return React elements
        const parts = [];
        let remaining = formatted;
        let keyIdx = 0;

        while (remaining.length > 0) {
          // Find the next special pattern
          const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
          const codeMatch = remaining.match(/`(.+?)`/);

          // Pick the earliest match
          let earliest = null;
          let type = null;
          
          if (boldMatch && (!earliest || boldMatch.index < earliest.index)) {
            earliest = boldMatch;
            type = 'bold';
          }
          if (codeMatch && (!earliest || codeMatch.index < earliest.index)) {
            earliest = codeMatch;
            type = 'code';
          }

          if (!earliest) {
            parts.push(<span key={keyIdx++}>{remaining}</span>);
            break;
          }

          // Add text before the match
          if (earliest.index > 0) {
            parts.push(<span key={keyIdx++}>{remaining.slice(0, earliest.index)}</span>);
          }

          // Add the formatted element
          if (type === 'bold') {
            parts.push(<strong key={keyIdx++} className="font-semibold text-slate-100">{earliest[1]}</strong>);
          } else if (type === 'code') {
            parts.push(
              <code key={keyIdx++} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[11px] font-mono">
                {earliest[1]}
              </code>
            );
          }

          remaining = remaining.slice(earliest.index + earliest[0].length);
        }

        // Check if it's a bullet point
        const isBullet = /^\s*[•\-]\s/.test(line);
        const isNumbered = /^\s*\d+[\.\)]\s/.test(line);
        const isEmoji = /^\s*[🔒🟢📤🤖✅❌💰⚪⏰⏳🔄⚖️📂🎯📋📊🔍ℹ️👤🌐📤💡🟡🔵🔴1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣]/.test(line.trim());
        const isIndented = /^\s{2,}/.test(line);

        return (
          <div
            key={i}
            className={`${isBullet || isEmoji ? 'pl-1' : ''} ${isIndented ? 'pl-3' : ''} ${isNumbered ? 'pl-0.5' : ''}`}
          >
            {parts}
          </div>
        );
      })}
    </div>
  );
}

// ── Quick Reply Buttons ───────────────────────────────────────
function QuickReplies({ replies, onSelect, disabled }) {
  if (!replies || replies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="flex flex-wrap gap-1.5 mt-2 ml-8"
    >
      {replies.map((text, i) => (
        <motion.button
          key={text}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.06 }}
          onClick={() => onSelect(text)}
          disabled={disabled}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono tracking-wide
                     border border-cyan-500/20 text-cyan-400/80
                     hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/10
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all duration-200 cursor-pointer"
        >
          {text}
        </motion.button>
      ))}
    </motion.div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, quickReplies]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Fetch welcome message when chat opens for the first time
  useEffect(() => {
    if (open && !welcomeLoaded && messages.length === 0) {
      setWelcomeLoaded(true);
      api.get('/chat/welcome')
        .then(({ data }) => {
          setMessages([{ role: 'assistant', content: data.reply }]);
          setQuickReplies(data.quickReplies || []);
        })
        .catch(() => {
          // Fallback welcome
          setMessages([{ role: 'assistant', content: 'Hi! 👋 How can I help you today?' }]);
          setQuickReplies(['My projects', 'Milestones', 'Help']);
        });
    }
  }, [open, welcomeLoaded, messages.length]);

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput('');
    setQuickReplies([]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { messages: updatedMessages });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setQuickReplies(data.quickReplies || []);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I couldn\'t process your request. Please try again.' },
      ]);
      setQuickReplies(['Help', 'My projects']);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 sm:right-6 z-[100]
                       w-[calc(100vw-2rem)] sm:w-[400px] h-[520px]
                       flex flex-col rounded-2xl overflow-hidden
                       border border-cyan-500/20 shadow-2xl"
            style={{
              background: 'rgba(6, 13, 20, 0.95)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.08), 0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/15 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 font-mono tracking-wide">TrustLayer AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-emerald-500/80 font-mono tracking-widest uppercase">Online</p>
                </div>
              </div>
              <button
                id="chat-close-btn"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-violet-500/15 border border-violet-500/30'
                        : 'bg-cyan-500/15 border border-cyan-500/30'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="w-3 h-3 text-violet-400" />
                        : <Bot className="w-3 h-3 text-cyan-400" />
                      }
                    </div>
                    {/* Bubble */}
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-500/15 border border-violet-500/20 text-slate-200'
                        : 'bg-cyan-500/8 border border-cyan-500/15 text-slate-300'
                    }`}>
                      {msg.role === 'assistant'
                        ? <FormattedMessage content={msg.content} />
                        : msg.content
                      }
                    </div>
                  </div>
                  {/* Quick replies after the last assistant message */}
                  {msg.role === 'assistant' && i === messages.length - 1 && !loading && (
                    <QuickReplies
                      replies={quickReplies}
                      onSelect={handleQuickReply}
                      disabled={loading}
                    />
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-cyan-500/8 border border-cyan-500/15">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-cyan-500/15 flex-shrink-0">
              <div className="flex items-center gap-2 bg-[#0a1628] border border-cyan-500/15 rounded-xl px-3 py-1.5 focus-within:border-cyan-500/40 transition-colors">
                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none font-mono py-1.5"
                />
                <button
                  id="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-lg text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubble */}
      <button
        id="chat-bubble-btn"
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 sm:right-6 z-[100]
                   w-12 h-12 rounded-2xl flex items-center justify-center
                   border border-cyan-500/30 hover:border-cyan-500/60
                   transition-all duration-300 group"
        style={{
          background: 'rgba(6, 13, 20, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.2), 0 0 60px rgba(6, 182, 212, 0.06)',
        }}
        title={open ? 'Close chat' : 'Open AI Assistant'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5 text-cyan-400" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}
