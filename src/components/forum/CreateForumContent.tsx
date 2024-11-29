'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ForumPost, CategoryBasicInfo } from '@/types/database';
import { User } from '@supabase/auth-helpers-nextjs';
import { UserRole } from '@prisma/client';

interface CreateForumContentProps {
  mode: 'thread' | 'reply';
  threadId?: string;
  categoryId?: string;
  categories?: CategoryBasicInfo[];
  onSuccess?: (newContent: ForumPost) => void;
  user?: User;
  userRole?: UserRole | null;
}

export default function CreateForumContent({
  mode,
  threadId,
  categoryId,
  categories,
  onSuccess,
  user
}: CreateForumContentProps) {
  console.log('CreateForumContent rendered:', { mode, categoryId, user });
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(mode === 'thread' ? '/api/forum/threads' : '/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'thread'
            ? { title, content, categoryId: selectedCategory }
            : { threadId, content }
        ),
      });

      if (!response.ok) throw new Error(`Failed to create ${mode}`);
      
      const newContent = await response.json();
      onSuccess?.(newContent);
      
      setContent('');
      setTitle('');
      setIsOpen(false);
    } catch (error) {
      console.error(`Error creating ${mode}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90">
          {mode === 'thread' ? 'Create Thread' : 'Reply'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'thread' ? 'Create New Thread' : 'Reply to Thread'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'thread' && (
            <>
              <div className="space-y-2">
                <label htmlFor="title">Thread Title</label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              {!categoryId && (
                <div className="space-y-2">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <div className="space-y-2">
            <label htmlFor="content">Content</label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 