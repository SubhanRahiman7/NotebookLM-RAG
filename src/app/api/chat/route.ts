import { NextRequest, NextResponse } from 'next/server';
import { generateAnswerStream } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query, collectionName } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'No query provided' },
        { status: 400 }
      );
    }

    if (!collectionName) {
      return NextResponse.json(
        { success: false, message: 'No document uploaded. Please upload a document first.' },
        { status: 400 }
      );
    }

    const result = await generateAnswerStream(query, collectionName);

    return NextResponse.json({
      success: true,
      message: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
