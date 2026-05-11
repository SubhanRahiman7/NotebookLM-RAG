import { Document } from '@langchain/core/documents';
export type { Document } from '@langchain/core/documents';
import { GoogleAuth } from 'google-auth-library';

const QDRANT_URL = process.env.QDRANT_URL || 'https://ee3b14e5-d533-414f-aaae-bf8d2877a3b1.eu-west-2-0.aws.cloud.qdrant.io:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'notebooklm-docs';

async function getGoogleToken(): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing GCP credentials');
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const token = await auth.getAccessToken();
  if (!token) throw new Error('Failed to get access token');
  return token;
}

async function embedText(text: string): Promise<number[]> {
  const token = await getGoogleToken();
  const projectId = process.env.GCP_PROJECT_ID;

  const res = await fetch(
    `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/text-embedding-005:predict`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ content: text }],
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Embedding failed: ${error}`);
  }

  const data = await res.json();
  return data.predictions[0].embeddings.values;
}

export async function createVectorStore(
  docs: Document[],
  collectionName: string = COLLECTION_NAME
): Promise<void> {
  const { QdrantClient } = await import('@qdrant/js-client-rest');
  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  });

  // Create collection if not exists
  try {
    await client.createCollection(collectionName, {
      vectors: { size: 768, distance: 'Cosine' },
    });
  } catch {
    // Collection may already exist
  }

  const points = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    console.log(`Embedding chunk ${i + 1}/${docs.length}...`);

    const vector = await embedText(doc.pageContent);

    points.push({
      id: i + 1,
      vector,
      payload: {
        content: doc.pageContent,
        source: (doc.metadata as Record<string, unknown>).source || '',
        pageNumber: (doc.metadata as Record<string, unknown>).pageNumber || 1,
      },
    });
  }

  await client.upsert(collectionName, { points });
}

export async function getVectorStore(): Promise<void> {
  // No-op for now
}

export async function similaritySearch(
  query: string,
  k: number = 4,
  collectionName: string = COLLECTION_NAME
): Promise<Document[]> {
  const queryVector = await embedText(query);

  const { QdrantClient } = await import('@qdrant/js-client-rest');
  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  });

  const results = await client.search(collectionName, {
    vector: queryVector,
    limit: k,
    with_payload: true,
  });

  return results.map((r) => {
    const payload = r.payload as { content?: string; source?: string; pageNumber?: number } | null;
    return new Document({
      pageContent: payload?.content || '',
      metadata: {
        source: payload?.source || '',
        pageNumber: payload?.pageNumber || 1,
      },
    });
  });
}