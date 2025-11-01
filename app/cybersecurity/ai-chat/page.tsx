'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import Header from '@/components/Header';
import { authenticatedPost } from '@/lib/apiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function AIChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load chat history on mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

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

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Don't close if clicking the toggle button
        if (!target.closest('.sidebar-toggle-button')) {
          setSidebarOpen(false);
        }
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen]);

  // Generate chat title from first user message
  const generateChatTitle = (firstMessage: string): string => {
    const maxLength = 30;
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    return firstMessage.substring(0, maxLength) + '...';
  };

  // Load all chat sessions from Firestore
  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const chatsRef = collection(db, 'users', user.uid, 'aiChats');
      const q = query(chatsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const chats: ChatSession[] = [];
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as ChatSession);
      });

      setChatHistory(chats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Save current chat to Firestore
  const saveCurrentChat = async (newMessages: Message[]) => {
    if (!user || newMessages.length === 0) return;

    try {
      const chatId = currentChatId || Date.now().toString();
      const firstUserMessage = newMessages.find(m => m.role === 'user');
      const title = firstUserMessage ? generateChatTitle(firstUserMessage.content) : 'New Chat';

      const chatData: ChatSession = {
        id: chatId,
        title,
        messages: newMessages,
        createdAt: currentChatId ? chatHistory.find(c => c.id === currentChatId)?.createdAt || Date.now() : Date.now(),
        updatedAt: Date.now(),
      };

      const chatRef = doc(db, 'users', user.uid, 'aiChats', chatId);
      await setDoc(chatRef, chatData);

      if (!currentChatId) {
        setCurrentChatId(chatId);
      }

      // Reload chat history to update sidebar
      await loadChatHistory();
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  // Load a specific chat
  const loadChat = async (chatId: string) => {
    if (!user) return;

    try {
      const chatRef = doc(db, 'users', user.uid, 'aiChats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data() as ChatSession;
        setMessages(chatData.messages);
        setCurrentChatId(chatId);
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent loading the chat when clicking delete

    if (!user) return;
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      const chatRef = doc(db, 'users', user.uid, 'aiChats', chatId);
      await deleteDoc(chatRef);

      // If deleting current chat, start a new one
      if (chatId === currentChatId) {
        createNewChat();
      }

      // Reload chat history
      await loadChatHistory();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Create a new chat
  const createNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI chat API with full conversation history using authenticated request
      const data = await authenticatedPost('/api/ai-chat', {
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        userId: user?.uid
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Auto-save chat after AI response
      await saveCurrentChat(finalMessages);
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

      {/* Sidebar Toggle Button & New Chat Button */}
      <div className="top-controls">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle-button"
          title="Chat History"
        >
          <svg
            className="sidebar-toggle-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </button>

        <button
          onClick={createNewChat}
          className="new-chat-button"
          title="New Chat"
        >
          <svg
            className="new-chat-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="new-chat-text">New Chat</span>
        </button>
      </div>

      {/* Chat History Sidebar */}
      {sidebarOpen && (
        <div ref={sidebarRef} className="chat-sidebar">
          <div className="sidebar-header">
            <h3 className="sidebar-title">Chat History</h3>
          </div>
          <div className="sidebar-content">
            {chatHistory.length === 0 ? (
              <p className="sidebar-empty">No chat history yet</p>
            ) : (
              <div className="chat-list">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={`chat-item ${chat.id === currentChatId ? 'chat-item-active' : ''}`}
                  >
                    <div className="chat-item-content">
                      <div className="chat-item-title">{chat.title}</div>
                      <div className="chat-item-date">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="chat-item-delete"
                      title="Delete chat"
                    >
                      <svg
                        className="delete-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                  {message.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="user-message-text">{message.content}</div>
                  )}
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
          position: relative;
        }

        .chat-header {
          padding-top: 32px;
          padding-bottom: 16px;
          flex-shrink: 0;
        }

        /* Top Controls */
        .top-controls {
          display: flex;
          gap: 12px;
          padding: 0 clamp(20px, 4vw, 48px);
          margin-bottom: 16px;
          max-width: 1280px;
          width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        .sidebar-toggle-button {
          padding: 12px;
          background: #0f0f0f;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-toggle-button:hover {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        .sidebar-toggle-icon {
          width: 20px;
          height: 20px;
          color: #8b5cf6;
        }

        .new-chat-button {
          padding: 12px 20px;
          background: #0f0f0f;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e5e5e5;
          font-size: 14px;
          font-weight: 600;
        }

        .new-chat-button:hover {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        .new-chat-icon {
          width: 20px;
          height: 20px;
          color: #10b981;
        }

        .new-chat-text {
          display: none;
        }

        @media (min-width: 640px) {
          .new-chat-text {
            display: inline;
          }
        }

        /* Chat Sidebar */
        .chat-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: clamp(280px, 80vw, 360px);
          background: #0f0f0f;
          box-shadow: 12px 0 24px rgba(0, 0, 0, 0.5);
          z-index: 100;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .sidebar-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid #1a1a1a;
        }

        .sidebar-title {
          font-size: 24px;
          font-weight: bold;
          color: #e5e5e5;
          margin: 0;
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .sidebar-empty {
          text-align: center;
          color: #666666;
          padding: 40px 20px;
          font-size: 14px;
        }

        .chat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #0f0f0f;
          box-shadow: 6px 6px 12px #050505, -6px -6px 12px #191919;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          gap: 12px;
        }

        .chat-item:hover {
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #191919;
        }

        .chat-item-active {
          border: 2px solid #8b5cf6;
        }

        .chat-item-content {
          flex: 1;
          min-width: 0;
        }

        .chat-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #e5e5e5;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-item-date {
          font-size: 12px;
          color: #a8a8a8;
        }

        .chat-item-delete {
          padding: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-item-delete:hover {
          background: #1a1a1a;
        }

        .delete-icon {
          width: 16px;
          height: 16px;
          color: #f43f5e;
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
          line-height: 1.8;
        }

        .user-message-text {
          color: #e5e5e5;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        /* Markdown styling for AI messages - using :global to ensure styles apply */
        .message-assistant .message-content :global(h1),
        .message-assistant .message-content :global(h2),
        .message-assistant .message-content :global(h3),
        .message-assistant .message-content :global(h4) {
          color: #8b5cf6 !important;
          font-weight: 700 !important;
          margin-top: clamp(20px, 3vw, 28px) !important;
          margin-bottom: clamp(12px, 2vw, 16px) !important;
          line-height: 1.3 !important;
        }

        .message-assistant .message-content :global(h1) {
          font-size: clamp(22px, 3.5vw, 32px) !important;
        }

        .message-assistant .message-content :global(h2) {
          font-size: clamp(20px, 3vw, 28px) !important;
        }

        .message-assistant .message-content :global(h3) {
          font-size: clamp(18px, 2.5vw, 24px) !important;
        }

        .message-assistant .message-content :global(h4) {
          font-size: clamp(16px, 2vw, 20px) !important;
        }

        .message-assistant .message-content :global(p) {
          margin-top: 0 !important;
          margin-bottom: clamp(16px, 2.5vw, 20px) !important;
          line-height: 1.8 !important;
          color: #e5e5e5 !important;
        }

        .message-assistant .message-content :global(p:last-child) {
          margin-bottom: 0 !important;
        }

        .message-assistant .message-content :global(strong) {
          color: #e5e5e5 !important;
          font-weight: 700 !important;
        }

        .message-assistant .message-content :global(em) {
          font-style: italic !important;
          color: #e5e5e5 !important;
        }

        .message-assistant .message-content :global(ul),
        .message-assistant .message-content :global(ol) {
          margin-left: clamp(20px, 3vw, 28px) !important;
          margin-top: clamp(12px, 2vw, 16px) !important;
          margin-bottom: clamp(16px, 2.5vw, 20px) !important;
          padding-left: 0 !important;
        }

        .message-assistant .message-content :global(li) {
          margin-bottom: clamp(8px, 1.5vw, 12px) !important;
          line-height: 1.8 !important;
          color: #e5e5e5 !important;
        }

        .message-assistant .message-content :global(li:last-child) {
          margin-bottom: 0 !important;
        }

        .message-assistant .message-content :global(code) {
          background: #1a1a1a !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          font-family: 'Courier New', monospace !important;
          font-size: 0.9em !important;
          color: #10b981 !important;
          box-shadow: inset 2px 2px 4px #050505, inset -2px -2px 4px #242424 !important;
        }

        .message-assistant .message-content :global(pre) {
          background: #1a1a1a !important;
          padding: clamp(16px, 2.5vw, 20px) !important;
          border-radius: clamp(10px, 2vw, 14px) !important;
          overflow-x: auto !important;
          margin-top: clamp(12px, 2vw, 16px) !important;
          margin-bottom: clamp(16px, 2.5vw, 20px) !important;
          box-shadow: inset 4px 4px 8px #050505, inset -4px -4px 8px #242424 !important;
        }

        .message-assistant .message-content :global(pre code) {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }

        .message-assistant .message-content :global(a) {
          color: #8b5cf6 !important;
          text-decoration: underline !important;
          transition: color 0.2s ease !important;
        }

        .message-assistant .message-content :global(a:hover) {
          color: #a78bfa !important;
        }

        .message-assistant .message-content :global(blockquote) {
          border-left: 4px solid #8b5cf6 !important;
          padding-left: clamp(16px, 2.5vw, 20px) !important;
          margin-left: 0 !important;
          margin-top: clamp(12px, 2vw, 16px) !important;
          margin-bottom: clamp(16px, 2.5vw, 20px) !important;
          color: #a8a8a8 !important;
          font-style: italic !important;
        }

        .message-assistant .message-content :global(hr) {
          border: none !important;
          height: 1px !important;
          background: #333 !important;
          margin: clamp(20px, 3vw, 28px) 0 !important;
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

          .top-controls {
            max-width: 1600px;
          }
        }
      `}</style>
    </div>
  );
}
