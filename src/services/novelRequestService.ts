import type { NovelRequest } from '@/types/database';
import supabase from '@/lib/supabaseClient';
import { generateUUID } from '@/lib/utils';

interface NovelRequestVote {
  profile_id: string;
}

interface VoteResponse {
  success: boolean;
  votes: number;
  hasVoted: boolean;
}

export async function getNovelRequests(): Promise<NovelRequest[]> {
  const { data: requests, error } = await supabase
    .from('novel_requests')
    .select(`
      *,
      profile:profiles (
        username
      ),
      votes:novel_request_votes (
        profile_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching novel requests:', error);
    throw new Error('Failed to fetch novel requests');
  }

  // Get current user's session
  const { data: { session } } = await supabase.auth.getSession();

  // Map the data to match our NovelRequest type
  return requests.map(request => ({
    id: request.id,
    title: request.title,
    author: request.author,
    description: request.description,
    originalLanguage: request.original_language,
    coverImage: request.cover_image,
    createdAt: new Date(request.created_at),
    updatedAt: new Date(request.updated_at),
    profileId: request.profile_id,
    profile: request.profile,
    hasVoted: session?.user ? request.votes.some((vote: NovelRequestVote) => vote.profile_id === session.user.id) : false,
    voteCount: request.votes.length
  }));
}

export async function createNovelRequest(
  title: string,
  author: string,
  description: string,
  originalLanguage: string,
  coverImage: string,
  userId: string | null
): Promise<NovelRequest> {
  if (!userId) {
    throw new Error('Must be logged in to create a request');
  }

  const id = generateUUID();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('novel_requests')
    .insert([{
      id,
      title,
      author,
      description,
      original_language: originalLanguage,
      cover_image: coverImage,
      profile_id: userId,
      created_at: now,
      updated_at: now
    }])
    .select(`
      *,
      profile:profiles (
        username
      ),
      votes:novel_request_votes (
        profile_id
      )
    `)
    .single();

  if (error) {
    console.error('Error creating novel request:', error);
    throw new Error('Failed to create novel request');
  }

  return {
    id: data.id,
    title: data.title,
    author: data.author,
    description: data.description,
    originalLanguage: data.original_language,
    coverImage: data.cover_image,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    profileId: data.profile_id,
    profile: data.profile,
    hasVoted: false,
    voteCount: 0
  };
}

export async function toggleVote(requestId: string, userId: string): Promise<VoteResponse> {
  try {
    // First check if vote exists
    const { data: votes, error: fetchError } = await supabase
      .from('novel_request_votes')
      .select('*')
      .eq('request_id', requestId)
      .eq('profile_id', userId);

    if (fetchError) {
      throw new Error('Failed to check vote status');
    }

    const existingVote = votes && votes.length > 0 ? votes[0] : null;

    if (existingVote) {
      // Remove vote if it exists
      const { error: deleteError } = await supabase
        .from('novel_request_votes')
        .delete()
        .eq('request_id', requestId)
        .eq('profile_id', userId);

      if (deleteError) throw new Error('Failed to remove vote');
    } else {
      // Add new vote
      const { error: insertError } = await supabase
        .from('novel_request_votes')
        .insert({
          id: generateUUID(),
          request_id: requestId,
          profile_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError) throw new Error('Failed to add vote');
    }

    // Get updated vote count
    const { data: updatedVotes, error: countError } = await supabase
      .from('novel_request_votes')
      .select('*')
      .eq('request_id', requestId);

    if (countError) throw new Error('Failed to get updated vote count');

    return {
      success: true,
      votes: updatedVotes?.length || 0,
      hasVoted: !existingVote
    };
  } catch (error) {
    console.error('Vote toggle error:', error);
    throw error;
  }
} 