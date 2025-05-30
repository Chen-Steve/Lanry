'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { DonationModal } from './DonationModal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TranslatorLinksProps {
  translator: {
    username: string | null;
    profile_id: string;
    kofiUrl?: string;
    patreonUrl?: string;
    customUrl?: string;
    customUrlLabel?: string;
    author_bio?: string;
  };
}

export const TranslatorLinks = ({ translator }: TranslatorLinksProps) => {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!translator.kofiUrl && !translator.patreonUrl && !translator.customUrl && !translator.author_bio) return null;
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      {translator.author_bio && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {translator.author_bio}
          </p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => isAuthenticated ? setShowDonationModal(true) : toast.error('Please sign in to donate')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-medium transition-colors"
        >
          <span>Donate Coins</span>
        </button>

        {translator.kofiUrl && (
          <a
            href={translator.kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-[#13C3FF]/10 hover:bg-[#13C3FF]/20 text-[#13C3FF] font-medium transition-colors"
          >
            <Icon icon="simple-icons:kofi" className="text-base" />
            <span>Ko-fi</span>
          </a>
        )}
        {translator.patreonUrl && (
          <a
            href={translator.patreonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-[#FF424D]/10 hover:bg-[#FF424D]/20 text-[#FF424D] font-medium transition-colors"
          >
            <Icon icon="simple-icons:patreon" className="text-base" />
            <span>Patreon</span>
          </a>
        )}
        {translator.customUrl && (
          <a
            href={translator.customUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            <Icon icon="mdi:link-variant" className="text-base" />
            <span>{translator.customUrlLabel || 'Support'}</span>
          </a>
        )}
      </div>

      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        recipientId={translator.profile_id}
        recipientName={translator.username || 'Author'}
      />
    </div>
  );
}; 