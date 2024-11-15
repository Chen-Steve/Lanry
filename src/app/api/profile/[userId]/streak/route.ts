import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: params.userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    const lastVisit = profile.lastVisit;
    
    let newStreak = 1; // Default for first visit or broken streak
    
    if (lastVisit) {
      const lastVisitDay = new Date(lastVisit);
      lastVisitDay.setHours(0, 0, 0, 0);
      const todayDay = new Date(today);
      todayDay.setHours(0, 0, 0, 0);
      
      const diffTime = todayDay.getTime() - lastVisitDay.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (diffDays === 0) {
        return NextResponse.json(profile); // Same day, no update needed
      } else if (diffDays === 1) {
        newStreak = profile.currentStreak + 1;
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: params.userId },
      data: {
        currentStreak: newStreak,
        lastVisit: today,
        updatedAt: today,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 