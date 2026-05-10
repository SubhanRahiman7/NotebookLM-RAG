import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface ParsedPDF {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

export interface ChunkResult {
  chunks: Document[];
  pageCount: number;
}

/**
 * Parse a PDF file buffer into text content with metadata
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  const pdfParse = await import('pdf-parse');
  const data = await pdfParse.default(buffer);

  return {
    text: data.text,
    numPages: data.numpages,
    metadata: {
      title: data.metadata?.Title,
      author: data.metadata?.Author,
      creationDate: data.metadata?.CreationDate
        ? new Date(data.metadata.CreationDate)
        : undefined,
    },
  };
}

/**
 * Chunking Strategy: Recursive Character Text Splitter
 *
 * This strategy splits text by recursively trying different separators
 * in order to keep semantic blocks together (paragraphs, sentences, words).
 *
 * Configuration:
 * - chunkSize: 1000 characters - optimal for embedding models
 * - chunkOverlap: 200 characters - ensures context continuity between chunks
 * - separators: ["\n\n", "\n", ". ", " ", ""] - tries to keep paragraphs, then
 *   sentences, then words together before falling back to individual characters
 *
 * Why this strategy?
 * 1. Preserves semantic meaning - related text stays together
 * 2. Overlap ensures no information loss at chunk boundaries
 * 3. 1000 chars is optimal for text-embedding models
 * 4. Better retrieval quality than fixed-size character splitting
 */
export function createChunker(chunkSize: number = 1000, chunkOverlap: number = 200) {
  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });
}

/**
 * Parse PDF and split into chunks for embedding
 */
export async function loadAndChunkPDF(
  buffer: Buffer,
  filename: string
): Promise<ChunkResult> {
  const parsed = await parsePDF(buffer);
  const textSplitter = createChunker(1000, 200);

  const pages = parsed.text.split('\n\n').filter((s) => s.trim().length > 0);

  const docs: Document[] = pages.map((content, index) => {
    const pageNumber = Math.floor(index / 10) + 1;
    return new Document({
      pageContent: content,
      metadata: {
        source: filename,
        pageNumber,
        totalPages: parsed.numPages,
      },
    });
  });

  const chunks = await textSplitter.splitDocuments(docs);

  return {
    chunks,
    pageCount: parsed.numPages,
  };
}

/**
 * Alternative: Sentence-based chunking for better semantic preservation
 * Use when documents have clear sentence boundaries
 */
export async function loadAndChunkBySentences(
  buffer: Buffer,
  filename: string
): Promise<ChunkResult> {
  const parsed = await parsePDF(buffer);
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
    separators: ['. ', '? ', '! ', '\n', ' '],
  });

  const docs = [
    new Document({
      pageContent: parsed.text,
      metadata: {
        source: filename,
        totalPages: parsed.numPages,
      },
    }),
  ];

  const chunks = await textSplitter.splitDocuments(docs);

  return {
    chunks,
    pageCount: parsed.numPages,
  };
}
