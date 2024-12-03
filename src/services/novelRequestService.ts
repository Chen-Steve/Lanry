import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';

interface Vote {
  profile_id: string;
}

export interface NovelRequest {
  id: string;
  title: string;
  author: string;
  description: string;
  originalLanguage: string;
  coverImage?: string;
  votes: number;
  createdAt: string;
  updatedAt: string;
  hasVoted?: boolean;
}

// Database response type with snake_case fields
interface DatabaseNovelRequest {
  id: string;
  title: string;
  author: string;
  description: string;
  original_language: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
  votes: Vote[];
}

export async function getNovelRequests(): Promise<NovelRequest[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('novel_requests')
      .select(`
        *,
        votes:novel_request_votes(profile_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedData = (data as DatabaseNovelRequest[]).map(request => ({
      id: request.id,
      title: request.title,
      author: request.author,
      description: request.description,
      originalLanguage: request.original_language,
      coverImage: request.cover_image,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      hasVoted: user ? request.votes.some((vote: Vote) => vote.profile_id === user.id) : false,
      votes: request.votes.length
    }));

    return transformedData.sort((a, b) => b.votes - a.votes);
  } catch (error) {
    console.error('Error fetching novel requests:', error);
    return [];
  }
}

export async function createNovelRequest(
  title: string,
  author: string,
  description: string,
  originalLanguage: string,
  coverImage?: string
): Promise<NovelRequest | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('novel_requests')
      .insert({
        id: generateUUID(),
        title,
        author,
        description,
        original_language: originalLanguage,
        cover_image: coverImage,
        profile_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      votes: 0,
      hasVoted: false
    };
  } catch (error) {
    console.error('Error creating novel request:', error);
    return null;
  }
}

export async function toggleVote(requestId: string): Promise<{ success: boolean; votes: number; hasVoted: boolean }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user has already voted
    const { data: existingVote, error: voteError } = await supabase
      .from('novel_request_votes')
      .select('*')
      .eq('request_id', requestId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (voteError) throw voteError;

    let hasVoted = false;

    if (existingVote) {
      // Remove vote
      await supabase
        .from('novel_request_votes')
        .delete()
        .eq('request_id', requestId)
        .eq('profile_id', user.id);
      hasVoted = false;
    } else {
      // Add vote
      await supabase
        .from('novel_request_votes')
        .insert({
          id: generateUUID(),
          request_id: requestId,
          profile_id: user.id,
          created_at: new Date().toISOString()
        });
      hasVoted = true;
    }

    // Get updated vote count
    const { data: updatedVotes, error: countError } = await supabase
      .from('novel_request_votes')
      .select('*', { count: 'exact' })
      .eq('request_id', requestId);

    if (countError) throw countError;

    return {
      success: true,
      votes: updatedVotes?.length || 0,
      hasVoted
    };
  } catch (error) {
    console.error('Error toggling vote:', error);
    throw error;
  }
} 