'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

const PRESET_AMOUNTS = [10, 20, 40];

export function DonationModal({ isOpen, onClose, recipientId, recipientName }: DonationModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Please sign in to donate');
      return;
    }

    const coins = parseInt(amount);
    if (isNaN(coins) || coins < 1) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: recipientId,
          amount: coins,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process donation');
      }

      toast.success(`Successfully donated ${coins} coins to ${recipientName}!`);
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Donation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-background border border-border rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Support {recipientName}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Amount to Donate</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon icon="ph:coin-fill" className="text-amber-500 text-lg" />
              </div>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[eE]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className="px-3 py-1.5 text-sm rounded-full bg-accent hover:bg-accent/80 text-foreground font-medium transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="px-4 py-2 text-sm font-medium text-amber-500 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Icon icon="mdi:loading" className="animate-spin text-lg" />
              ) : (
                'Donate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 