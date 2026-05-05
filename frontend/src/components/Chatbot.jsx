import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Render bold (**text**) and newlines in bot messages
function BotText({ text }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <div key={i} style={{ marginBottom: i < lines.length - 1 && line === '' ? 6 : 0 }}>
            {parts.map((part, j) =>
              j % 2 === 1
                ? <strong key={j}>{part}</strong>
                : <span key={j}>{part}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Quick-reply suggestions per role
const QUICK_REPLIES = {
  student: [
    'What is my attendance?',
    'Do I have pending assignments?',
    'Show my grades',
    'Any pending payments?',
    'What courses am I in?',
  ],
  tutor: [
    'How many students do I have?',
    'Show my courses',
    'How to mark attendance?',
    'How to grade assignments?',
  ],
  admin: [
    'System overview',
    'How many students?',
    'Total revenue?',
    'How to enroll a student?',
  ],
};

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const name = user?.name?.split(' ')[0] || 'there';
      setMessages([{
        from: 'bot',
        text: `Hi ${name}! 👋 I'm your OTMS AI assistant.\n\nI have access to your real account data. Ask me anything about your ${user?.role || ''} account!`,
        time: new Date()
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { from: 'user', text: msg, time: new Date() }]);
    setInput('');
    setShowQuick(false);
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', { message: msg });
      setMessages(prev => [...prev, { from: 'bot', text: res.data.message, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'Sorry, I ran into an error. Please try again.',
        time: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = QUICK_REPLIES[user?.role] || QUICK_REPLIES.student;
  const formatTime = (d) => d?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Toggle button */}
      <button
        className="chatbot-toggle"
        onClick={() => setOpen(o => !o)}
        title="AI Assistant"
        style={{ background: open ? '#374151' : '#4f46e5' }}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div className="chatbot-window" style={{ height: 520 }}>
          {/* Header */}
          <div className="chatbot-header" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>OTMS AI Assistant</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
                <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.85 }}>Online — knows your account data</p>
              </div>
            </div>
            <button onClick={() => setMessages([])} title="Clear chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" style={{ padding: '12px 14px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div className={`chat-msg ${msg.from}`} style={{
                  maxWidth: '88%',
                  lineHeight: 1.55,
                  fontSize: '0.84rem',
                  padding: '10px 13px',
                  borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
                }}>
                  {msg.from === 'bot' ? <BotText text={msg.text} /> : msg.text}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                  {formatTime(msg.time)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
                <div className="chat-msg bot" style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${j * 0.2}s`
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick replies */}
            {showQuick && messages.length <= 1 && !loading && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8, textAlign: 'center' }}>
                  Quick questions:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {quickReplies.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      style={{
                        padding: '5px 10px', borderRadius: 20, border: '1px solid #e0e7ff',
                        background: '#f5f3ff', color: '#4f46e5', fontSize: '0.75rem',
                        cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.target.style.background = '#4f46e5'; e.target.style.color = 'white'; }}
                      onMouseLeave={e => { e.target.style.background = '#f5f3ff'; e.target.style.color = '#4f46e5'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input" style={{ padding: '10px 12px', gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about attendance, grades, payments..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{ borderRadius: 22, padding: '8px 14px', fontSize: '0.84rem' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: input.trim() ? '#4f46e5' : '#e2e8f0',
                color: input.trim() ? 'white' : '#94a3b8',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
