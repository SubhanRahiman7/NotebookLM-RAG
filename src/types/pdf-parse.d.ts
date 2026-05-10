declare module 'pdf-parse' {
  interface PDFMetadata {
    Title?: string;
    Author?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFData {
    numpages: number;
    text: string;
    metadata?: PDFMetadata;
  }

  interface PDFParseOptions {
    max?: number;
    version?: string;
  }

  function pdf(dataBuffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;

  export = pdf;
}
