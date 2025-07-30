import { Tag } from '@/types/database';
import supabase from '@/lib/supabaseClient';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

export async function getTags(): Promise<Tag[]> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch('/api/tags', { headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tags');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

export async function getNovelTags(novelId: string): Promise<Tag[]> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`/api/novels/${novelId}/tags`, { headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch novel tags');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching novel tags:', error);
    throw error;
  }
}

export async function addNovelTags(novelId: string, tagIds: string[]): Promise<boolean> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`/api/novels/${novelId}/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tagIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add tags');
    }
    return true;
  } catch (error) {
    console.error('Error adding tags:', error);
    return false;
  }
}

export async function removeNovelTag(novelId: string, tagId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`/api/novels/${novelId}/tags/${tagId}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove tag');
    }
    return true;
  } catch (error) {
    console.error('Error removing tag:', error);
    return false;
  }
}

export async function createTag(name: string, description?: string): Promise<Tag> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, description }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Throw specific error message from the API
      throw new Error(data.error || 'Failed to create tag');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating tag:', error);
    // Re-throw the error with the specific message
    throw error instanceof Error ? error : new Error('Failed to create tag');
  }
} 