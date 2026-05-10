import { similaritySearch, type Document } from './vectorStore';

export interface SourceChunk {
  content: string;
  pageNumber: number;
  metadata: {
    source: string;
  };
}

export interface QueryResult {
  answer: string;
  sources: SourceChunk[];
}

const MODEL_NAME = 'gemini-2.5-flash';

async function getAccessToken(): Promise<{ token: string; projectId: string }> {
  const { GoogleAuth } = await import('google-auth-library');

  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.GCP_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing GCP credentials. Please set GCP_PROJECT_ID, GCP_CLIENT_EMAIL, and GCP_PRIVATE_KEY environment variables.');
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const token = await auth.getAccessToken();
  if (!token) {
    throw new Error('Failed to obtain access token');
  }
  return { token, projectId };
}

export async function generateAnswer(
  query: string,
  collectionName: string = 'notebooklm-docs'
): Promise<QueryResult> {
  const retrievedDocs: Document[] = await similaritySearch(query, 4, collectionName);

  if (retrievedDocs.length === 0) {
    return {
      answer: 'No relevant information found in the uploaded document. Please upload a document first.',
      sources: [],
    };
  }

  const sources: SourceChunk[] = retrievedDocs.map((doc: Document, i: number) => ({
    content: doc.pageContent,
    pageNumber: (doc.metadata as { pageNumber?: number }).pageNumber || i + 1,
    metadata: {
      source: (doc.metadata as { source?: string }).source || 'Unknown',
    },
  }));

  const context = retrievedDocs
    .map((doc: Document, i: number) => `[Page ${(doc.metadata as { pageNumber?: number }).pageNumber || i + 1}]: ${doc.pageContent}`)
    .join('\n\n');

  const systemPrompt = `You are an AI assistant that helps users understand their uploaded documents.
Your role is to answer questions based ONLY on the provided context from the document.

Rules:
- ONLY answer based on the available context from the file
- If the context doesn't contain enough information, say "I couldn't find this information in your document"
- Never make up information or use your general knowledge
- Always cite which parts of your answer come from which page (e.g., "According to page 3...")
- Be helpful and concise in your responses

Context from the document:
${context}`;

  const { token, projectId } = await getAccessToken();
  const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${MODEL_NAME}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: query }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Gemini API error:', errorText);
    return {
      answer: 'Failed to generate answer. Please try again.',
      sources: [],
    };
  }

  const data = await res.json();
  const answer =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join('') ||
    'No response generated.';

  return {
    answer,
    sources,
  };
}

export async function generateAnswerStream(
  query: string,
  collectionName: string = 'notebooklm-docs'
): Promise<QueryResult> {
  const retrievedDocs: Document[] = await similaritySearch(query, 4, collectionName);

  if (retrievedDocs.length === 0) {
    return {
      answer: 'No relevant information found in the uploaded document. Please upload a document first.',
      sources: [],
    };
  }

  const sources: SourceChunk[] = retrievedDocs.map((doc: Document, i: number) => ({
    content: doc.pageContent,
    pageNumber: (doc.metadata as { pageNumber?: number }).pageNumber || i + 1,
    metadata: {
      source: (doc.metadata as { source?: string }).source || 'Unknown',
    },
  }));

  const context = retrievedDocs
    .map((doc: Document, i: number) => `[Page ${(doc.metadata as { pageNumber?: number }).pageNumber || i + 1}]: ${doc.pageContent}`)
    .join('\n\n');

  const systemPrompt = `You are an AI assistant that helps users understand their uploaded documents.
Your role is to answer questions based ONLY on the provided context from the document.

Rules:
- ONLY answer based on the available context from the file
- If the context doesn't contain enough information, say "I couldn't find this information in your document"
- Never make up information or use your general knowledge
- Always cite which parts of your answer come from which page (e.g., "According to page 3...")
- Be helpful and concise in your responses

Context from the document:
${context}`;

  const { token, projectId } = await getAccessToken();
  const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${MODEL_NAME}:streamGenerateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: query }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Gemini streaming API error:', errorText);
    return {
      answer: 'Failed to generate answer. Please try again.',
      sources: [],
    };
  }

  let fullAnswer = '';

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            fullAnswer += text;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  return {
    answer: fullAnswer || 'No response generated.',
    sources,
  };
}