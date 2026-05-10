'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentFilename, setDocumentFilename] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = (docId: string, filename: string, pages: number) => {
    setDocumentId(docId);
    setDocumentFilename(filename);
    setPageCount(pages);
  };

  const handleReset = () => {
    setDocumentId(null);
    setDocumentFilename(null);
    setPageCount(0);
  };

  const collectionName = documentId ? `doc-${documentId}` : '';

  return (
    <main className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-secondary/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">NotebookLM</span>
                <span className="text-white/80 ml-2 font-normal">RAG</span>
              </h1>
              <p className="text-xs text-white/50">AI-Powered Document Analysis</p>
            </div>
          </div>

          {documentFilename && (
            <div className="flex items-center gap-4">
              <div className="glass-effect rounded-lg px-4 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{documentFilename}</p>
                  <p className="text-xs text-white/40">{pageCount} pages</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                New Document
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto h-full">
          {!documentId ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] animate-fade-in">
              {/* Hero Section */}
              <div className="text-center mb-12 max-w-2xl">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">
                  <span className="gradient-text">Upload. Analyze. Ask.</span>
                </h2>
                <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                  Upload any document and ask questions in natural language.
                  Get answers grounded in your document content with AI.
                </p>
              </div>

              {/* Upload Zone */}
              <div className="w-full max-w-2xl mb-16">
                <UploadZone
                  onUploadComplete={handleUploadComplete}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                <div className="glass-effect rounded-2xl p-6 hover:bg-dark-tertiary/50 transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white/90">Upload Documents</h3>
                  <p className="text-sm text-white/50">Support for PDF and TXT files up to 10MB</p>
                </div>

                <div className="glass-effect rounded-2xl p-6 hover:bg-dark-tertiary/50 transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white/90">Smart Indexing</h3>
                  <p className="text-sm text-white/50">Documents are chunked and embedded for retrieval</p>
                </div>

                <div className="glass-effect rounded-2xl p-6 hover:bg-dark-tertiary/50 transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white/90">Ask Questions</h3>
                  <p className="text-sm text-white/50">Get grounded answers with source citations</p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="mt-16 flex items-center gap-2 text-white/40 text-sm">
                <span>Built with</span>
                <span className="px-2 py-1 rounded bg-white/5 text-white/60">Gemini 2.5 Flash</span>
                <span>+</span>
                <span className="px-2 py-1 rounded bg-white/5 text-white/60">Qdrant Vector DB</span>
                <span>+</span>
                <span className="px-2 py-1 rounded bg-white/5 text-white/60">Next.js</span>
              </div>
            </div>
          ) : (
            <div className="glass-effect rounded-2xl overflow-hidden h-[calc(100vh-180px)] animate-fade-in">
              <ChatInterface
                collectionName={collectionName}
                documentFilename={documentFilename!}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}