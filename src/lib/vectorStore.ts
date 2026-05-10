import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

const QDRANT_URL = process.env.QDRANT_URL || 'https://ee3b14e5-d533-414f-aaae-bf8d2877a3b1.eu-west-2-0.aws.cloud.qdrant.io:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'notebooklm-docs';

export async function createVectorStore(
  docs: Document[],
  collectionName: string = COLLECTION_NAME
): Promise<QdrantVectorStore> {
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
  });

  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    collectionName,
  });
  return vectorStore;
}

export async function getVectorStore(
  collectionName: string = COLLECTION_NAME
): Promise<QdrantVectorStore> {
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    collectionName,
  });
  return vectorStore;
}

export async function similaritySearch(
  query: string,
  k: number = 4,
  collectionName: string = COLLECTION_NAME
): Promise<Document[]> {
  const vectorStore = await getVectorStore(collectionName);
  const results = await vectorStore.similaritySearch(query, k);
  return results;
}

export type { Document };
