import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CancelMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CancelMembershipModal({ isOpen, onClose }: CancelMembershipModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast.success('Your membership has been cancelled');
      onClose();
      // Refresh the page to update subscription status
      window.location.reload();
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Membership</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground mb-4">
            Are you sure you want to cancel your membership? You&apos;ll continue to have access until the end of your current billing period.
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="px-4 py-2 bg-transparent border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Keep Membership
            </button>
            <button 
              onClick={handleCancel} 
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 