import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total count of novels
    const count = await prisma.novel.count();
    
    // Skip a random number of novels
    const skip = Math.floor(Math.random() * count);
    
    // Get one random novel
    const novel = await prisma.novel.findFirst({
      skip,
      take: 1,
      select: {
        slug: true,
      }
    });

    if (!novel) {
      return NextResponse.json(
        { error: 'No novels found' },
        { status: 404 }
      );
    }

    // Return just the slug directly
    return NextResponse.json({ slug: novel.slug });
  } catch (error) {
    console.error('Error fetching random novel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random novel' },
      { status: 500 }
    );
  }
} 