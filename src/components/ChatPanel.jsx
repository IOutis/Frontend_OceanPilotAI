// src/components/ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, BotIcon } from './HelperIcons';

const COLORS = {
  // Updated softer background
  softBackground: '#FDFDFB',
  
  // Bot styling - green theme
  botBackground: '#E8F5E8',
  botIcon: '#22C55E',
  botBorder: '#BBF7D0',
  
  // User styling - blue-grey theme
  userBackground: '#64748B',
  userText: '#FFFFFF',
  userIcon: '#475569',
  
  // System styling - beige/neutral theme
  systemBackground: '#F5F5DC',
  systemText: '#8B7355',
  systemBorder: '#E5E5DC',
  
  // General
  borderColor: '#E2E8F0',
  inputBorder: '#CBD5E1',
  inputFocus: '#3B82F6',
  buttonGreen: '#C19D77',
  buttonHover: '#A8845F',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280'
};

const ChatPanel = ({ 
  activePhase = null, 
  onSend = null, 
  isAgentThinking = false,
  messages = null,
  input = '',
  onInputChange = null,
  onSendMessage = null,
  isThinking = false
}) => {
  // Use external messages if provided, otherwise use internal state
  const [internalMessages, setInternalMessages] = useState([
    { id: `m-${Date.now()}`, from: 'bot', role: 'system', text: 'Hello! Upload a dataset to begin.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef(null);
  
  // Determine which messages and input to use
  const displayMessages = messages || internalMessages;
  const currentInput = input !== undefined ? input : inputValue;
  const currentIsThinking = isThinking || isAgentThinking;

  useEffect(() => {
    if (!activePhase || messages) return; // Don't add context message if using external messages
    const ctxMsg = {
      id: `m-ctx-${Date.now()}`,
      from: 'bot',
      role: 'system',
      text: `Context updated. Now viewing results for "${activePhase.name}". Ask me anything about this data.`
    };
    setInternalMessages(prev => [...prev, ctxMsg]);
  }, [activePhase, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [displayMessages, currentIsThinking]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = currentInput.trim();
    if (!trimmed) return;

    // If using external message handling, delegate to parent
    if (onSendMessage) {
      onSendMessage(e);
      return;
    }

    // Otherwise use internal logic
    const userMsg = { id: `u-${Date.now()}`, from: 'user', role: 'user', text: trimmed };
    setInternalMessages(prev => [...prev, userMsg]);
    setInputValue('');
    if (typeof onSend === 'function') onSend(trimmed);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    enter: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24,
        opacity: { duration: 0.2 }
      }
    },
    exit: { 
      opacity: 0, 
      y: -8, 
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  const bubbleStyle = (msg) => {
    if (msg.role === 'system') {
      return { 
        background: COLORS.systemBackground, 
        color: COLORS.systemText, 
        fontStyle: 'italic',
        border: `1px solid ${COLORS.systemBorder}`
      };
    }
    if (msg.from === 'user') {
      return { 
        background: COLORS.userBackground, 
        color: COLORS.userText,
        boxShadow: '0 2px 8px rgba(100, 116, 139, 0.15)'
      };
    }
    return { 
      background: COLORS.botBackground, 
      color: COLORS.textPrimary,
      border: `1px solid ${COLORS.botBorder}`,
      boxShadow: '0 1px 3px rgba(34, 197, 94, 0.1)'
    };
  };

  const TypingDots = () => (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="text-sm mr-2" style={{ color: COLORS.textSecondary }}>
        Assistant is typing
      </span>
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.span
          key={i}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.2, 
            delay,
            ease: "easeInOut"
          }}
          className="w-2 h-2 rounded-full"
          style={{ background: COLORS.botIcon }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="flex flex-col h-full rounded-2xl shadow-lg border"
      style={{ background: COLORS.softBackground, borderColor: COLORS.borderColor }}
    >
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: COLORS.borderColor }}>
        <div className="p-1.5 rounded-lg" style={{ background: COLORS.botBackground }}>
          <BotIcon className="w-5 h-5" style={{ color: COLORS.botIcon }} />
        </div>
        <div>
          <div style={{ color: COLORS.textPrimary }} className="font-heading font-semibold">LLM Assistant</div>
          <div style={{ color: COLORS.textSecondary }} className="text-xs">Ask questions about the active dataset</div>
        </div>
      </div>

      {/* messages */}
      <div ref={listRef} className="flex-grow overflow-y-auto px-4 py-5 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence initial={false}>
          {displayMessages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial="hidden"
              animate="enter"
              exit="exit"
              variants={itemVariants}
              className={`flex gap-3 items-end ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.from !== 'user' && (
                <div className="flex-shrink-0 mb-1" aria-hidden>
                  <div className="p-1.5 rounded-lg" style={{ background: COLORS.botBackground }}>
                    <BotIcon className="w-4 h-4" style={{ color: COLORS.botIcon }} />
                  </div>
                </div>
              )}
              <motion.div 
                className="rounded-2xl px-4 py-3 max-w-[78%] leading-snug" 
                style={bubbleStyle(m)} 
                aria-live="polite"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div style={{ fontSize: 14 }}>{m.text}</div>
              </motion.div>
              {m.from === 'user' && (
                <div className="flex-shrink-0 mb-1" aria-hidden>
                  <div className="p-1.5 rounded-lg" style={{ background: COLORS.userBackground }}>
                    <UserIcon className="w-4 h-4" style={{ color: COLORS.userText }} />
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {currentIsThinking && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center gap-3 justify-start"
            >
              <div className="flex-shrink-0">
                <div className="p-1.5 rounded-lg" style={{ background: COLORS.botBackground }}>
                  <BotIcon className="w-4 h-4" style={{ color: COLORS.botIcon }} />
                </div>
              </div>
              <div className="rounded-2xl shadow-sm" style={{ background: COLORS.botBackground, border: `1px solid ${COLORS.botBorder}` }}>
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* input */}
      <form
        onSubmit={handleSendMessage}
        className="px-4 py-4 border-t flex items-center gap-3 rounded-b-2xl"
        style={{ borderColor: COLORS.borderColor, background: COLORS.softBackground }}
      >
        <motion.input
          value={currentInput}
          onChange={onInputChange || ((e) => setInputValue(e.target.value))}
          placeholder={currentIsThinking ? "Agent is processing..." : "Ask about the active data..."}
          disabled={currentIsThinking}
          aria-label="Chat input"
          className="flex-grow rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
          style={{
            border: `1px solid ${COLORS.inputBorder}`,
            background: '#FFFFFF',
            color: COLORS.textPrimary,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
          whileFocus={{
            scale: 1.01,
            boxShadow: `0 0 0 3px ${COLORS.inputFocus}20, 0 2px 8px rgba(0, 0, 0, 0.1)`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
        <motion.button
          whileHover={{ 
            scale: 1.05,
            backgroundColor: COLORS.buttonHover
          }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={currentIsThinking}
          className="rounded-xl px-5 py-3 font-body font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: inputValue.trim() ? COLORS.buttonGreen : COLORS.inputBorder,
            border: `1px solid ${inputValue.trim() ? COLORS.buttonGreen : COLORS.inputBorder}`,
            boxShadow: inputValue.trim() ? '0 2px 8px rgba(22, 163, 74, 0.2)' : 'none'
          }}
        >
          Send
        </motion.button>
      </form>
    </div>
  );
};

export default ChatPanel;