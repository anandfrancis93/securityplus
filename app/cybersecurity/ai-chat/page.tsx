'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import Header from '@/components/Header';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AIChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI chat API with full conversation history
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userId: user?.uid
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0f0f',
      }}>
        <div style={{
          background: '#0f0f0f',
          borderRadius: '24px',
          padding: '80px',
          boxShadow: '12px 12px 24px #050505, -12px -12px 24px #191919',
        }}>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#e5e5e5' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <Header />
      </div>

      {/* Chat Area */}
      <div className="chat-content">
        {/* Hero Section (only shown when no messages) */}
        {messages.length === 0 && (
          <div className="chat-hero">
            <div className="chat-hero-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h1 className="chat-hero-title">AI Chat</h1>
            <p className="chat-hero-subtitle">
              Ask me anything about Security+ topics or general questions
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${message.role === 'user' ? 'message-wrapper-user' : 'message-wrapper-assistant'}`}
            >
              <div className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="message-wrapper message-wrapper-assistant">
              <div className="message message-assistant">
                <div className="message-loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="chat-send-button"
            title="Send message"
          >
            <svg
              className="chat-send-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0f0f0f;
          color: #e5e5e5;
        }

        .chat-header {
          padding-top: 32px;
          padding-bottom: 16px;
          flex-shrink: 0;
        }

        .chat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 0 clamp(20px, 4vw, 48px);
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
        }

        .chat-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(48px, 8vw, 80px) 0;
          gap: clamp(24px, 4vw, 32px);
        }

        .chat-hero-icon {
          width: clamp(80px, 12vw, 120px);
          height: clamp(80px, 12vw, 120px);
          border-radius: 24px;
          background: #0f0f0f;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
        }

        .chat-hero-icon svg {
          width: clamp(40px, 6vw, 60px);
          height: clamp(40px, 6vw, 60px);
        }

        .chat-hero-title {
          font-size: clamp(40px, 8vw, 80px);
          font-weight: bold;
          letter-spacing: -0.025em;
          color: #e5e5e5;
          margin: 0;
        }

        .chat-hero-subtitle {
          font-size: clamp(16px, 2.5vw, 24px);
          color: #a8a8a8;
          max-width: 600px;
          margin: 0;
        }

        .chat-messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 3vw, 24px);
          padding-bottom: clamp(24px, 4vw, 32px);
        }

        .message-wrapper {
          display: flex;
          width: 100%;
        }

        .message-wrapper-user {
          justify-content: flex-end;
        }

        .message-wrapper-assistant {
          justify-content: flex-start;
        }

        .message {
          max-width: 70%;
          padding: clamp(16px, 3vw, 24px);
          border-radius: clamp(16px, 2vw, 24px);
          font-size: clamp(14px, 2.5vw, 18px);
          line-height: 1.6;
          word-wrap: break-word;
        }

        .message-user {
          background: #0f0f0f;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
          border: 2px solid #8b5cf6;
        }

        .message-assistant {
          background: #0f0f0f;
          box-shadow: 12px 12px 24px #050505, -12px -12px 24px #191919;
        }

        .message-content {
          color: #e5e5e5;
          white-space: pre-wrap;
        }

        .message-loading {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px 0;
        }

        .message-loading span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .message-loading span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .message-loading span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .chat-input-container {
          flex-shrink: 0;
          padding: clamp(16px, 3vw, 24px) clamp(20px, 4vw, 48px);
          border-top: 1px solid #1a1a1a;
          background: #0f0f0f;
        }

        .chat-input-wrapper {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          gap: clamp(12px, 2vw, 16px);
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          padding: clamp(16px, 3vw, 20px);
          font-size: clamp(14px, 2.5vw, 18px);
          line-height: 1.6;
          background: #0f0f0f;
          border: 2px solid #1a1a1a;
          border-radius: clamp(16px, 2vw, 20px);
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
          color: #e5e5e5;
          resize: none;
          max-height: 200px;
          overflow-y: auto;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chat-input:focus {
          outline: none;
          border-color: #8b5cf6;
        }

        .chat-input::placeholder {
          color: #666666;
        }

        .chat-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-send-button {
          width: clamp(48px, 8vw, 56px);
          height: clamp(48px, 8vw, 56px);
          flex-shrink: 0;
          border-radius: clamp(12px, 2vw, 16px);
          background: #0f0f0f;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-send-button:hover:not(:disabled) {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        .chat-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-send-icon {
          width: clamp(20px, 3vw, 24px);
          height: clamp(20px, 3vw, 24px);
          color: #8b5cf6;
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .message {
            max-width: 85%;
          }
        }

        /* 4K screens */
        @media (min-width: 1920px) {
          .chat-content {
            max-width: 1600px;
          }

          .chat-input-wrapper {
            max-width: 1600px;
          }
        }
      `}</style>
    </div>
  );
}
