'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';

interface TranslatorChapterEditProps {
  chapterId: string;
  novelId: string;
  initialContent: string;
  initialTitle: string;
  initialAuthorThoughts?: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function TranslatorChapterEdit({
  chapterId,
  novelId,
  initialContent,
  initialTitle,
  initialAuthorThoughts,
  onSave,
  onCancel
}: TranslatorChapterEditProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [authorThoughts, setAuthorThoughts] = useState(initialAuthorThoughts || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // First verify if user is the translator for this novel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .select('translator_id, author_profile_id, is_author_name_custom')
        .eq('id', novelId)
        .single();

      if (novelError) throw novelError;
      
      // Check if user is translator or created the novel as a translator
      const isTranslator = novel.translator_id === user.id;
      const isTranslatorCreated = novel.author_profile_id === user.id && novel.is_author_name_custom === true;
      
      if (!isTranslator && !isTranslatorCreated) {
        throw new Error('Not authorized to edit this chapter');
      }
      
      const { error } = await supabase
        .from('chapters')
        .update({
          content,
          title,
          author_thoughts: authorThoughts || null
        })
        .eq('id', chapterId)
        .eq('novel_id', novelId);

      if (error) throw error;

      toast.success('Chapter updated successfully');
      onSave();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save chapter');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Chapter</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="mdi:content-save" className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Chapter Title"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[500px] px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm"
            placeholder="Chapter Content"
          />
        </div>

        <div>
          <label htmlFor="authorThoughts" className="block text-sm font-medium mb-1">
            Author&apos;s Thoughts
          </label>
          <textarea
            id="authorThoughts"
            value={authorThoughts}
            onChange={(e) => setAuthorThoughts(e.target.value)}
            className="w-full h-32 px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Author's Thoughts (Optional)"
          />
        </div>
      </div>
    </div>
  );
} 