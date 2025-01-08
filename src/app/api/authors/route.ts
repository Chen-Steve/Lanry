import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase();

    // Get authors and translators
    const users = await prisma.profile.findMany({
      where: {
        AND: [
          {
            role: {
              in: [UserRole.AUTHOR, UserRole.TRANSLATOR]
            }
          },
          query ? {
            username: {
              contains: query,
              mode: 'insensitive'
            }
          } : {}
        ]
      },
      select: {
        username: true,
        role: true
      },
      orderBy: {
        username: 'asc'
      },
      take: 10
    });

    return NextResponse.json(users.map(user => ({
      username: user.username,
      role: user.role
    })));
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
} 