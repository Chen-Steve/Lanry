import { Tag } from '@/types/database';

export async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetch('/api/tags');
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

export async function getNovelTags(novelId: string): Promise<Tag[]> {
  try {
    const response = await fetch(`/api/novels/${novelId}/tags`);
    if (!response.ok) throw new Error('Failed to fetch novel tags');
    return response.json();
  } catch (error) {
    console.error('Error fetching novel tags:', error);
    throw error;
  }
}

export async function addNovelTags(novelId: string, tagIds: string[]): Promise<boolean> {
  try {
    const response = await fetch(`/api/novels/${novelId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tagIds }),
    });
    if (!response.ok) throw new Error('Failed to add tags');
    return true;
  } catch (error) {
    console.error('Error adding tags:', error);
    return false;
  }
}

export async function removeNovelTag(novelId: string, tagId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/novels/${novelId}/tags/${tagId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove tag');
    return true;
  } catch (error) {
    console.error('Error removing tag:', error);
    return false;
  }
}

export async function createTag(name: string, description?: string): Promise<Tag> {
  try {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error('Failed to create tag');
    return response.json();
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
} 