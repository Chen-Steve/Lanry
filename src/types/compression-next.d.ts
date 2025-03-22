declare module 'compression-next' {
  import { NextRequest, NextResponse } from 'next/server';

  interface CompressionOptions {
    level?: number;
    threshold?: number;
    filter?: (req: NextRequest) => boolean;
  }

  function compression(options?: CompressionOptions): (req: NextRequest) => Promise<NextResponse | undefined>;

  export default compression;
} 