'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface WiseTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentWiseTag?: string | null;
}

export function WiseTagModal({ isOpen, onClose, onSuccess, currentWiseTag }: WiseTagModalProps) {
  const [wiseTag, setWiseTag] = useState(currentWiseTag || '');
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    try {
      const trimmedTag = wiseTag.trim().replace('@', ''); // Remove @ if user added it
      
      if (trimmedTag && trimmedTag.length < 3) {
        toast.error('Wise tag must be at least 3 characters long');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          wise_tag: trimmedTag || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('This Wise tag is already in use by another user');
        } else {
          throw error;
        }
        return;
      }

      toast.success(trimmedTag ? 'Wise tag updated successfully!' : 'Wise tag removed successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating Wise tag:', error);
      toast.error('Failed to update Wise tag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          wise_tag: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Wise tag removed successfully!');
      setWiseTag('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error removing Wise tag:', error);
      toast.error('Failed to remove Wise tag');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="simple-icons:wise" className="text-green-600 text-xl" />
            <h3 className="text-lg font-semibold">Wise Tag</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon icon="mdi:close" className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">
            Connect your Wise tag to enable faster processing of Wise payments. When you make a payment, 
                         we&apos;ll be able to match it to your account and credit your coins within an hour.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Icon icon="heroicons:information-circle" className="text-amber-600 text-sm mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-medium mb-1">How to find your Wise tag:</p>
                <p>• Open your Wise app</p>
                <p>• Go to your profile</p>
                <p>• Your Wise tag starts with @ (e.g., @johndoe)</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="wiseTag" className="block text-sm font-medium mb-2">
              Wise Tag
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <input
                id="wiseTag"
                type="text"
                value={wiseTag}
                onChange={(e) => setWiseTag(e.target.value)}
                placeholder="johndoe"
                className="w-full pl-8 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your Wise tag without the @ symbol
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                wiseTag ? 'Update Wise Tag' : 'Save Wise Tag'
              )}
            </button>
            
            {currentWiseTag && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isLoading}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 