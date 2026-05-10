import { NextRequest, NextResponse } from 'next/server';
import { loadAndChunkPDF } from '@/lib/pdf';
import { createVectorStore } from '@/lib/vectorStore';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const documentId = uuidv4();
    const collectionName = `doc-${documentId}`;

    const { chunks, pageCount } = await loadAndChunkPDF(buffer, file.name);

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Could not extract text from the document. Please ensure it contains text.' },
        { status: 400 }
      );
    }

    await createVectorStore(chunks, collectionName);

    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      pageCount,
      chunkCount: chunks.length,
      message: `Successfully indexed ${chunks.length} chunks from ${pageCount} pages`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process document' },
      { status: 500 }
    );
  }
}
