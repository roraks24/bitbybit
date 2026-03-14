'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '@/lib/api';

// ── Markdown-lite renderer ────────────────────────────────────
function FormattedMessage({ content }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />;

        const parts = [];
        let remaining = line;
        let keyIdx = 0;

        while (remaining.length > 0) {
          const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
          const codeMatch = remaining.match(/`(.+?)`/);

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

          if (earliest.index > 0) {
            parts.push(<span key={keyIdx++}>{remaining.slice(0, earliest.index)}</span>);
          }

          if (type === 'bold') {
            parts.push(<strong key={keyIdx++} style={{ color: 'var(--text-main)', fontWeight: 600 }}>{earliest[1]}</strong>);
          } else if (type === 'code') {
            parts.push(
              <code key={keyIdx++} className="px-1.5 py-0.5 rounded text-[11px]"
                style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>
                {earliest[1]}
              </code>
            );
          }

          remaining = remaining.slice(earliest.index + earliest[0].length);
        }

        const isBullet = /^\s*[•\-]\s/.test(line);
        const isNumbered = /^\s*\d+[\.\\)]\s/.test(line);
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
          className="px-2.5 py-1 rounded-lg text-[11px] tracking-wide
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all duration-200 cursor-pointer"
          style={{
            border: '1px solid var(--card-border)',
            color: 'var(--cyan)',
            background: 'transparent',
          }}
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, quickReplies]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (open && !welcomeLoaded && messages.length === 0) {
      setWelcomeLoaded(true);
      api.get('/chat/welcome')
        .then(({ data }) => {
          setMessages([{ role: 'assistant', content: data.reply }]);
          setQuickReplies(data.quickReplies || []);
        })
        .catch(() => {
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
                       flex flex-col rounded-2xl overflow-hidden glass-card neon-border"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--divider)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan-dim)', border: '1px solid var(--card-border)' }}>
                <Bot className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-main)' }}>TrustLayer AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--badge-active-text)' }} />
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--badge-active-text)', opacity: 0.8 }}>Online</p>
                </div>
              </div>
              <button
                id="chat-close-btn"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
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
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: msg.role === 'user' ? 'rgba(124,58,237,0.1)' : 'var(--cyan-dim)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.25)' : 'var(--card-border)'}`,
                      }}>
                      {msg.role === 'user'
                        ? <User className="w-3 h-3" style={{ color: '#7c3aed' }} />
                        : <Bot className="w-3 h-3" style={{ color: 'var(--cyan)' }} />
                      }
                    </div>
                    {/* Bubble */}
                    <div className="max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed"
                      style={{
                        background: msg.role === 'user' ? 'rgba(124,58,237,0.08)' : 'var(--cyan-dim)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'var(--card-border)'}`,
                        color: 'var(--text-main)',
                      }}>
                      {msg.role === 'assistant'
                        ? <FormattedMessage content={msg.content} />
                        : msg.content
                      }
                    </div>
                  </div>
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
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--cyan-dim)', border: '1px solid var(--card-border)' }}>
                    <Bot className="w-3 h-3" style={{ color: 'var(--cyan)' }} />
                  </div>
                  <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--cyan-dim)', border: '1px solid var(--card-border)' }}>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--cyan)', opacity: 0.6, animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--cyan)', opacity: 0.6, animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--cyan)', opacity: 0.6, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--divider)' }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none py-1.5"
                  style={{ color: 'var(--text-main)' }}
                />
                <button
                  id="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-lg disabled:opacity-30 transition-all"
                  style={{ color: 'var(--cyan)' }}
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
                   w-12 h-12 rounded-2xl flex items-center justify-center glass-card
                   transition-all duration-300 group"
        title={open ? 'Close chat' : 'Open AI Assistant'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" style={{ color: 'var(--cyan)' }} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-5 h-5 transition-colors" style={{ color: 'var(--cyan)' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}
