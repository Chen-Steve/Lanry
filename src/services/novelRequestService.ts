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
  votes: number;
  createdAt: string;
  updatedAt: string;
  hasVoted?: boolean;
}

interface NovelRequestResponse extends Omit<NovelRequest, 'votes'> {
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
      .order('votes', { ascending: false });

    if (error) throw error;

    return (data as NovelRequestResponse[]).map(request => ({
      ...request,
      hasVoted: user ? request.votes.some((vote: Vote) => vote.profile_id === user.id) : false,
      votes: request.votes.length
    }));
  } catch (error) {
    console.error('Error fetching novel requests:', error);
    return [];
  }
}

export async function createNovelRequest(
  title: string,
  author: string,
  description: string,
  originalLanguage: string
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
    const { data: existingVote } = await supabase
      .from('novel_request_votes')
      .select()
      .eq('request_id', requestId)
      .eq('profile_id', user.id)
      .single();

    if (existingVote) {
      // Remove vote
      await supabase
        .from('novel_request_votes')
        .delete()
        .eq('request_id', requestId)
        .eq('profile_id', user.id);

      const { data: updatedRequest } = await supabase
        .from('novel_requests')
        .select('votes:novel_request_votes(profile_id)')
        .eq('id', requestId)
        .single();

      return {
        success: true,
        votes: updatedRequest?.votes?.length || 0,
        hasVoted: false
      };
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

      const { data: updatedRequest } = await supabase
        .from('novel_requests')
        .select('votes:novel_request_votes(profile_id)')
        .eq('id', requestId)
        .single();

      return {
        success: true,
        votes: updatedRequest?.votes?.length || 0,
        hasVoted: true
      };
    }
  } catch (error) {
    console.error('Error toggling vote:', error);
    return {
      success: false,
      votes: 0,
      hasVoted: false
    };
  }
} 