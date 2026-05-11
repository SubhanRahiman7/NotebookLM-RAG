'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onUploadComplete: (documentId: string, filename: string, pageCount: number) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

export default function UploadZone({ onUploadComplete, isUploading, setIsUploading }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onUploadComplete(data.documentId, data.filename, data.pageCount);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload file. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, setIsUploading]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-white/10 hover:border-white/20 bg-black-100/30'
        } ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-base font-medium text-white/70 mb-1">Processing document...</p>
              <p className="text-sm text-white/30">Extracting text and creating embeddings</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className={`relative transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
              <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-lg font-medium text-white/80 mb-1">Drop your document here</p>
              <p className="text-sm text-white/35">or click to browse</p>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/25">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">PDF</span>
              <span className="text-white/15">or</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">TXT</span>
              <span className="text-white/10 mx-1">|</span>
              <span>Max 10MB</span>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mt-4 p-3.5 rounded-xl text-center text-sm animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}