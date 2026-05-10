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

  const collectionName = documentId ? `doc-${documentId}` : '';

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">NotebookLM RAG</h1>
              <p className="text-sm text-gray-500">Document Q&A with AI</p>
            </div>
          </div>

          {documentFilename && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate max-w-[200px]">{documentFilename}</span>
              <span className="text-gray-400">({pageCount} pages)</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto h-full">
          {!documentId ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Upload a document to get started
                </h2>
                <p className="text-gray-600 text-lg max-w-xl">
                  Upload a PDF or text file, then ask questions about its content.
                  Answers are generated using only the information in your document.
                </p>
              </div>

              <UploadZone
                onUploadComplete={handleUploadComplete}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Upload</h3>
                  <p className="text-sm text-gray-600">Upload any PDF or text document</p>
                </div>

                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Index</h3>
                  <p className="text-sm text-gray-600">Document is chunked and embedded</p>
                </div>

                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ask</h3>
                  <p className="text-sm text-gray-600">Ask questions, get grounded answers</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-180px)]">
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
