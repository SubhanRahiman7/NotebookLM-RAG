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
    } catch (error) {
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
        className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-primary-500 bg-primary-500/5 scale-[1.02]'
            : 'border-dark-border hover:border-primary-400/50 bg-dark-secondary/30'
        } ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} disabled={isUploading} />

        {/* Animated Background Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-accent-purple/0 opacity-0 transition-opacity duration-300 pointer-events-none" />

        {isUploading ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-4 border-2 border-accent-purple/30 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <div>
              <p className="text-lg font-medium text-white/90 mb-1">Processing document...</p>
              <p className="text-sm text-white/40">Extracting text, chunking, and embedding</p>
            </div>
            {/* Progress dots */}
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Icon with glow effect */}
            <div className={`relative transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
              <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-xl font-semibold text-white/90 mb-2">
                Drop your document here
              </p>
              <p className="text-white/50">or click to browse</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/40">
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                PDF
              </span>
              <span className="text-white/20">or</span>
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                TXT
              </span>
              <span className="text-white/20">|</span>
              <span>Max 10MB</span>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mt-6 p-4 rounded-xl text-center animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}
    </div>
  );
}