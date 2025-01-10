import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const novel = await prisma.novel.update({
      where: { id: params.id },
      data: {
        views: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ views: novel.views });
  } catch (error) {
    console.error("Failed to increment views:", error);
    return NextResponse.json(
      { error: "Failed to increment views" },
      { status: 500 }
    );
  }
} 