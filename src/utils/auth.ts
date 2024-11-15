import type { User as NextAuthUser } from 'next-auth';
import { generateUsername } from './username';
import { prisma } from '@/lib/prisma';

export async function handleDiscordSignup(user: NextAuthUser) {
  if (!user.id) {
    console.error('[Server] No user ID provided');
    throw new Error('No user ID provided');
  }

  try {
    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    });

    if (existingProfile) {
      console.log('[Server] Profile already exists:', user.id);
      return existingProfile;
    }

    console.log('[Server] Attempting to create profile for:', {
      id: user.id,
      name: user.name,
      email: user.email
    });

    // Create new profile using Discord username
    const newProfile = await prisma.profile.create({
      data: {
        id: user.id,
        username: user.name || generateUsername(), // Use Discord username or generate one
        currentStreak: 0,
        role: 'USER',
        coins: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('[Server] Created new profile:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('[Server] Profile creation failed:', error);
    throw error;
  }
} 