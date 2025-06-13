import { NextResponse } from "next/server";

// Run at the edge for lower latency & memory
export const runtime = "edge";

/**
 * Increment novel views using Upstash Redis.
 * The Redis REST credentials (UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN)
 * must be present in the environment. This avoids the heavy Prisma client
 * and saves ~100-200 ms per invocation.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("Missing Upstash Redis REST env vars");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    // Upstash REST API – https://docs.upstash.com/redis/rest
    const incrURL = `${process.env.UPSTASH_REDIS_REST_URL}/incr/novel:views:${id}`;

    const upstashRes = await fetch(incrURL, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json"
      },
      // Edge runtime fetches already disallow caching, but we make it explicit
      cache: "no-store"
    });

    if (!upstashRes.ok) {
      const text = await upstashRes.text();
      throw new Error(`Upstash error: ${text}`);
    }

    const { result: views } = await upstashRes.json();

    return NextResponse.json({ views });
  } catch (error) {
    console.error("Failed to increment views via Upstash:", error);
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
} 