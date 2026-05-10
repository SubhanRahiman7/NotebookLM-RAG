'use client';

import { useState, useRef, useEffect } from 'react';
import { SourceChunk } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
}

interface ChatInterfaceProps {
  collectionName: string;
  documentFilename: string;
}

export default function ChatInterface({ collectionName, documentFilename }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentInput, collectionName }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          sources: data.sources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || 'Sorry, I could not process your question.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to get a response. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleSources = (messageId: string) => {
    setShowSources((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-dark-border bg-dark-tertiary/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white/90">Chat with Document</h2>
            <p className="text-xs text-white/40">{documentFilename}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">Ask about your document</h3>
            <p className="text-white/50 max-w-md mx-auto">
              I will answer based only on the content in <span className="text-primary-400">{documentFilename}</span>.
              Each answer will include source citations.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-br-md shadow-lg shadow-primary-500/20'
                  : 'glass-effect rounded-bl-md'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Message Content */}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {/* Sources Toggle */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleSources(msg.id)}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all ${
                      msg.role === 'user'
                        ? 'bg-white/10 hover:bg-white/20 text-white/80'
                        : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {showSources[msg.id] ? 'Hide sources' : `Show ${msg.sources.length} source${msg.sources.length > 1 ? 's' : ''}`}
                  </button>

                  {/* Sources Panel */}
                  {showSources[msg.id] && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {msg.sources.map((source, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-xs bg-white/5 rounded-lg p-3 border border-white/5"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 text-xs font-medium">
                              Page {source.pageNumber}
                            </span>
                            <span className="text-white/30 truncate">{source.metadata?.source}</span>
                          </div>
                          <p className="text-white/70 line-clamp-3 leading-relaxed">{source.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-effect rounded-2xl rounded-bl-md px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="typing-indicator flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400" />
                  <span className="w-2 h-2 rounded-full bg-primary-400" />
                  <span className="w-2 h-2 rounded-full bg-accent-purple" />
                </div>
                <span className="text-white/50 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-dark-border p-4 bg-dark-secondary/50">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your document..."
              className="w-full resize-none rounded-xl border border-dark-border bg-dark-tertiary px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            {/* Character count or hint */}
            {input.length > 0 && (
              <span className="absolute right-3 bottom-3 text-xs text-white/30">
                {input.length}/1000
              </span>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-primary-500/25 flex items-center gap-2"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}