'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
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

function parseFormattedText(text: string): ReactNode[] {
  const elements: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith('**') && matched.endsWith('**')) {
      elements.push(
        <strong key={match.index} className="font-semibold text-white">
          {matched.slice(2, -2)}
        </strong>
      );
    } else if (matched.startsWith('*') && matched.endsWith('*')) {
      elements.push(
        <em key={match.index} className="italic text-white/70">
          {matched.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

function formatMessage(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => (
    <span key={idx}>
      {parseFormattedText(line)}
      {idx < lines.length - 1 && <br />}
    </span>
  ));
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
    } catch {
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
      <div className="px-6 py-4 border-b border-white/5 bg-black/50">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white/90">Chat with Document</h2>
            <p className="text-[11px] text-white/30">{documentFilename}</p>
          </div>
          <div className="ml-auto">
            <span className="px-2 py-1 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">Ask about your document</h3>
            <p className="text-sm text-white/35 max-w-sm mx-auto">
              I will answer based only on the content in your document with source citations.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-br-sm shadow-lg shadow-primary-500/10'
                  : 'bg-white/5 text-white/80'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-[14px]">{formatMessage(msg.content)}</div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleSources(msg.id)}
                    className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${
                      msg.role === 'user'
                        ? 'bg-white/10 hover:bg-white/15 text-white/70'
                        : 'bg-white/5 hover:bg-white/10 text-white/40'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {showSources[msg.id] ? 'Hide sources' : `${msg.sources.length} source${msg.sources.length > 1 ? 's' : ''}`}
                  </button>

                  {showSources[msg.id] && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {msg.sources.map((source, sIdx) => (
                        <div key={sIdx} className="text-[12px] bg-black/30 rounded-lg p-3 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded bg-primary-500/15 text-primary-400 text-[10px] font-medium">
                              Page {source.pageNumber}
                            </span>
                          </div>
                          <div className="text-white/50 leading-relaxed">
                            <div className="whitespace-pre-wrap line-clamp-3">{formatMessage(source.content)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/5 rounded-2xl rounded-bl-sm px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="typing-indicator flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                </div>
                <span className="text-white/35 text-xs">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 p-4 bg-black/50">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-primary-500/50 transition-all text-[14px]"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-500 hover:to-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium text-[14px] shadow-lg shadow-primary-500/10"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}