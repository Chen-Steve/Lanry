import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

/**
 * Novel views endpoint - Database-based view tracking.
 * Increments the views count on the Novel model and creates a view log entry.
 * This replaces the previous Redis implementation to avoid rate limits.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // Use a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Increment the views count on the novel
      const updatedNovel = await tx.novel.update({
        where: { id },
        data: {
          views: {
            increment: 1
          }
        },
        select: {
          views: true
        }
      });

      // Create a view log entry
      await tx.novelViewLog.create({
        data: {
          novelId: id
        }
      });

      return updatedNovel;
    });

    return NextResponse.json({ views: result.views });
  } catch (error) {
    console.error("Failed to increment views:", error);
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
} 