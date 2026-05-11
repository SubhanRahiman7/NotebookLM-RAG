import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function createChunks(text: string, filename: string, numPages: number): Document[] {
  const chunks: Document[] = [];
  const chunkSize = 1000;
  const chunkOverlap = 200;
  const separator = '\n\n';

  const paragraphs = text.split(separator).filter(p => p.trim().length > 0);

  let currentChunk = '';
  let currentChunkSize = 0;

  for (const paragraph of paragraphs) {
    if (currentChunk.length > 0) {
      currentChunk += separator;
      currentChunkSize += separator.length;
    }

    if (currentChunkSize + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(new Document({
        pageContent: currentChunk.trim(),
        metadata: {
          source: filename,
          pageNumber: Math.floor(chunks.length / 5) + 1,
          totalPages: numPages,
        },
      }));

      const overlapText = paragraph.slice(-chunkOverlap);
      currentChunk = overlapText + separator + paragraph;
      currentChunkSize = overlapText.length + separator.length + paragraph.length;
    } else {
      currentChunk += paragraph;
      currentChunkSize += paragraph.length;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(new Document({
      pageContent: currentChunk.trim(),
      metadata: {
        source: filename,
        pageNumber: Math.floor(chunks.length / 5) + 1,
        totalPages: numPages,
      },
    }));
  }

  return chunks;
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload a PDF or TXT file.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const documentId = uuidv4();
    const collectionName = `doc-${documentId}`;

    let text = '';
    let numPages = 1;

    if (file.name.endsWith('.pdf')) {
      // Write file to temp location for LangChain PDFLoader
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');

      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `upload-${documentId}.pdf`);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(tempFilePath, buffer);

      try {
        const loader = new PDFLoader(tempFilePath);
        const docs = await loader.load();

        if (docs.length === 0) {
          throw new Error('No content extracted from PDF');
        }

        text = docs.map(d => d.pageContent).join('\n\n');
        numPages = docs.length;

        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        tempFilePath = null;
      } catch (pdfError) {
        // Clean up temp file if it exists
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        console.error('PDF parsing error:', pdfError);
        return NextResponse.json(
          { success: false, message: `Could not extract text from PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
    } else {
      // Plain text file
      const buffer = Buffer.from(await file.arrayBuffer());
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, message: 'Document appears to be empty or contains no extractable text.' },
        { status: 400 }
      );
    }

    const chunks = createChunks(text, file.name, numPages);

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Could not chunk document.' },
        { status: 400 }
      );
    }

    const { createVectorStore } = await import('@/lib/vectorStore');
    await createVectorStore(chunks, collectionName);

    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      pageCount: numPages,
      chunkCount: chunks.length,
      message: `Successfully indexed ${chunks.length} chunks from ${numPages} pages`,
    });
  } catch (error) {
    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {}
    }

    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}