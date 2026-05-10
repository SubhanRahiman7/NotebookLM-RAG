import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "notebooklm-docs";
const EMBEDDING_MODEL = "text-embedding-3-large";
const LLM_MODEL = "gpt-4o-mini";

interface ChunkResult {
  content: string;
  pageNumber: number;
  metadata: {
    source: string;
    loc: {
      pageNumber: number;
    };
  };
}

/**
 * Index a PDF file into Qdrant vector store
 * Based on the user's original indexing() function
 */
async function indexDocument(filePath: string): Promise<void> {
  console.log(`\n📄 Indexing: ${filePath}`);

  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  console.log(`   Loaded ${docs.length} document pages`);

  const embeddings = new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
  });

  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: QDRANT_URL,
    collectionName: COLLECTION_NAME,
  });

  console.log(`   ✅ Indexed to collection: ${COLLECTION_NAME}`);
  console.log(`   📦 ${docs.length} chunks stored`);
}

/**
 * Query the indexed document and generate an answer
 * Based on the user's original retrival() function
 */
async function queryDocument(userQuery: string, k: number = 3): Promise<void> {
  console.log(`\n🔍 Query: "${userQuery}"\n`);

  const embeddings = new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: QDRANT_URL,
    collectionName: COLLECTION_NAME,
  });

  const retriever = vectorStore.asRetriever({ k });
  const searchResults = await retriever.invoke(userQuery);

  console.log(`   Found ${searchResults.length} relevant chunks`);

  const context = searchResults
    .map((chunk, i) => `[Page ${(chunk.metadata as any)?.loc?.pageNumber || i + 1}]: ${chunk.pageContent}`)
    .join("\n\n");

  const systemPrompt = `You are an AI Assistant who helps resolving the user query based on the available context provided to you from PDF file with the content and page number.

Rules:
- Only answer based on the available context from the file only
- If the context doesn't contain enough information, say "I couldn't find this information in your document"
- Never make up information or use your general knowledge
- Always cite which parts of your answer come from which page

Context:
${context}`;

  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    temperature: 0.3,
  });

  console.log(`\n💬 Answer:\n`);
  console.log(response.choices[0].message.content);
  console.log(`\n   ─────────────────────────────────────`);

  console.log(`\n📚 Sources used (${searchResults.length}):\n`);
  searchResults.forEach((chunk, i) => {
    const pageNum = (chunk.metadata as any)?.loc?.pageNumber || i + 1;
    console.log(`   [${i + 1}] Page ${pageNum}: ${chunk.pageContent.substring(0, 100)}...`);
  });
}

/**
 * Interactive CLI mode
 */
async function runInteractive(): Promise<void> {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              NotebookLM RAG - CLI Mode                  ║
╠═══════════════════════════════════════════════════════════╣
║  Commands:                                               ║
║    index <file.pdf>  - Index a PDF document              ║
║    ask <question>   - Ask about the document            ║
║    quit             - Exit the program                  ║
╚═══════════════════════════════════════════════════════════╝
  `);

  while (true) {
    const input = await prompt("> ");

    if (input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
      console.log("\n👋 Goodbye!");
      rl.close();
      break;
    }

    if (input.toLowerCase().startsWith("index ")) {
      const filePath = input.substring(6).trim();
      try {
        await indexDocument(filePath);
      } catch (error) {
        console.log(`\n❌ Error: ${(error as Error).message}`);
      }
      continue;
    }

    if (input.toLowerCase().startsWith("ask ")) {
      const query = input.substring(4).trim();
      try {
        await queryDocument(query);
      } catch (error) {
        console.log(`\n❌ Error: ${(error as Error).message}`);
      }
      continue;
    }

    console.log(`\n⚠️  Unknown command. Try "index <file.pdf>" or "ask <question>"`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  runInteractive().catch(console.error);
} else if (args[0] === "index" && args[1]) {
  indexDocument(args[1]).catch(console.error);
} else if (args[0] === "ask" && args.slice(1).length > 0) {
  queryDocument(args.slice(1).join(" ")).catch(console.error);
} else {
  console.log(`
Usage:
  npx ts-node src/cli.ts                    # Interactive mode
  npx ts-node src/cli.ts index <file.pdf>  # Index a document
  npx ts-node src/cli.ts ask <question>     # Ask a question
  `);
}
