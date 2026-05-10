export interface Document {
  id: string;
  filename: string;
  uploadTime: Date;
  pageCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  timestamp: Date;
}

export interface SourceChunk {
  content: string;
  pageNumber: number;
  metadata: {
    source: string;
    loc: {
      pageNumber: number;
    };
  };
}

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  filename?: string;
  message?: string;
  pageCount?: number;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  sources?: SourceChunk[];
  error?: string;
}
