import { NextResponse } from "next/server";
import { redis } from '@/lib/redis';

// Run at the edge for lower latency & memory
export const runtime = "edge";

/**
 * Increment novel views using Upstash Redis.
 * We use the Upstash Redis SDK (which works over HTTP and is Edge-compatible)
 * to increment a counter. Credentials are picked up from UPSTASH_REDIS_URL &
 * UPSTASH_REDIS_TOKEN, the same ones already used everywhere else in the app.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const views = await redis.incr(`novel:views:${id}`);
    return NextResponse.json({ views });
  } catch (error) {
    console.error("Failed to increment views via Upstash:", error);
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
} 