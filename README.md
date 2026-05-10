# NotebookLM RAG

A full RAG (Retrieval-Augmented Generation) pipeline application inspired by Google NotebookLM. Upload any document and ask natural language questions about its content.

## Features

- **Document Upload**: Support for PDF and TXT files up to 10MB
- **Smart Chunking**: Recursive character text splitting for optimal embedding
- **Vector Storage**: Qdrant Cloud for semantic search
- **Grounded Answers**: LLM responses strictly based on document content
- **Source Citations**: Every answer cites the source pages

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INGESTION          2. CHUNKING           3. EMBEDDING       │
│  ┌─────────┐          ┌─────────┐           ┌─────────┐       │
│  │   PDF   │──────▶   │  Split  │──────▶    │ OpenAI  │       │
│  │ Parser  │          │  1000   │           │ text-   │       │
│  └─────────┘          │  chars  │           │ embed-3 │       │
│                       │ + 200   │           │ large   │       │
│                       │ overlap │           └─────────┘       │
│                       └─────────┘                                │
│                                                                 │
│  4. STORAGE            5. RETRIEVAL          6. GENERATION      │
│  ┌─────────┐          ┌─────────┐           ┌─────────┐       │
│  │ Qdrant  │          │  Top-K  │           │ Gemini  │       │
│  │ Cloud   │◀──────▶  │ Similar │◀──────▶   │  2.5    │       │
│  │         │          │ Search  │           │  Flash  │       │
│  └─────────┘          └─────────┘           └─────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Chunking Strategy

We use **Recursive Character Text Splitter** with the following configuration:

- **chunkSize**: 1000 characters - optimal for the embedding model
- **chunkOverlap**: 200 characters - ensures context continuity
- **Separators**: `["\n\n", "\n", ". ", " ", ""]` - tries to keep semantic blocks together

### Why This Strategy?

1. **Preserves semantic meaning** - Related text (paragraphs, sentences) stays together
2. **Overlap prevents information loss** - Important context isn't split at boundaries
3. **1000 chars is optimal** - Best performance for embedding models
4. **Better retrieval quality** - Matches user intent more accurately

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **LLM**: Google Gemini 2.5 Flash via Vertex AI
- **Embeddings**: OpenAI text-embedding-3-large
- **Vector DB**: Qdrant Cloud

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Platform service account with Vertex AI API enabled
- OpenAI API key for embeddings
- Qdrant Cloud account (free tier)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd notebooklm-rag

# Install dependencies
npm install

# Copy GCP service account JSON
cp /path/to/your/gcp.json ./gcp.json
```

### Environment Variables

Create a `.env.local` file with:

```env
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=notebooklm-docs
```

### Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### POST `/api/upload`

Upload a document for indexing.

```bash
curl -X POST -F "file=@document.pdf" http://localhost:3000/api/upload
```

**Response:**
```json
{
  "success": true,
  "documentId": "uuid",
  "filename": "document.pdf",
  "pageCount": 42,
  "chunkCount": 128
}
```

### POST `/api/chat`

Ask a question about the uploaded document.

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "What is debugging?", "collectionName": "doc-uuid"}' \
  http://localhost:3000/api/chat
```

**Response:**
```json
{
  "success": true,
  "message": "According to page 15...",
  "sources": [
    {
      "content": "Debugging is the process...",
      "pageNumber": 15,
      "metadata": { "source": "document.pdf" }
    }
  ]
}
```

## Project Structure

```
notebooklm-rag/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts   # Document upload endpoint
│   │   │   └── chat/route.ts    # Chat endpoint
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # Main UI
│   ├── components/
│   │   ├── UploadZone.tsx       # File upload component
│   │   └── ChatInterface.tsx   # Chat UI component
│   ├── lib/
│   │   ├── pdf.ts              # PDF parsing & chunking
│   │   ├── vectorStore.ts      # Qdrant Cloud integration
│   │   └── llm.ts              # Gemini via Vertex AI
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── gcp.json                    # Google Cloud credentials
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Template for .env.local
├── package.json
└── README.md
```

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set these environment variables in Vercel dashboard:
- `QDRANT_URL`
- `QDRANT_API_KEY`
- `QDRANT_COLLECTION_NAME`

Also copy your `gcp.json` to the project root before deploying.

## License

MIT