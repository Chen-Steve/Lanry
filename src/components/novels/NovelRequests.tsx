'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { NovelRequest } from '@/types/database';
import { getNovelRequests, toggleVote } from '@/services/novelRequestService';
import { toast } from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { RequestForm } from './RequestForm';

const RequestCard = ({ request, onVote }: { 
  request: NovelRequest; 
  onVote: (votes: number, hasVoted: boolean) => void 
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(request.hasVoted);
  const [localVotes, setLocalVotes] = useState(request.voteCount);
  const { isAuthenticated, userId } = useAuth();

  useEffect(() => {
    setLocalHasVoted(request.hasVoted);
    setLocalVotes(request.voteCount);
  }, [request.hasVoted, request.voteCount]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote');
      return;
    }

    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    setIsVoting(true);
    try {
      const response = await toggleVote(request.id, userId);
      const newHasVoted = !localHasVoted;
      const newVotes = response.votes;
      
      setLocalHasVoted(newHasVoted);
      setLocalVotes(newVotes);
      onVote(newVotes, newHasVoted);
      
      toast.success(newHasVoted ? 'Vote added' : 'Vote removed');
    } catch (error) {
      console.error('Error voting on request:', error);
      toast.error('Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex gap-4 py-6 border-b border-gray-100 last:border-0">
      <div className="w-24 h-36 md:w-28 md:h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
        {request.coverImage ? (
          <Image
            src={request.coverImage}
            alt={`Cover for ${request.title}`}
            width={192}
            height={288}
            priority={true}
            quality={95}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 96px, 112px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/192x288?text=No+Cover';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2">
            <Icon icon="mdi:book-outline" className="text-3xl mb-1" />
            <span className="text-xs text-center">No Cover</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-base text-gray-900 leading-tight">
              {request.title}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">by {request.author}</p>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`relative p-2 rounded-lg transition-colors
                ${localHasVoted 
                  ? 'bg-red-50 text-red-500' 
                  : 'active:bg-gray-100 text-gray-400'
                }`}
              title={isAuthenticated ? 'Vote for this novel' : 'Sign in to vote'}
            >
              <Icon
                icon={localHasVoted ? "pepicons-print:heart-filled" : "pepicons-print:heart"}
                className="text-xl transition-transform active:scale-90"
              />
              {isVoting && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <span className={`text-sm font-medium tabular-nums
              ${localHasVoted ? 'text-red-500' : 'text-gray-500'}`}
            >
              {localVotes}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 md:line-clamp-2 mt-2">
          {request.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Icon icon="mdi:translate" className="text-base" />
            {request.originalLanguage}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon icon="mdi:clock-outline" className="text-base" />
            {formatRelativeDate(request.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function NovelRequests() {
  const [requests, setRequests] = useState<NovelRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchRequests = async () => {
    const data = await getNovelRequests();
    setRequests(data);
  };

  const handleVoteUpdate = (requestId: string, votes: number, hasVoted: boolean) => {
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId 
          ? { ...request, voteCount: votes, hasVoted }
          : request
      )
    );
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleNewRequest = (request: NovelRequest) => {
    setRequests(prev => [request, ...prev]);
    setShowForm(false);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 pb-20 md:pb-8">
      <header className="flex items-center justify-between pb-2">
        <h2 className="text-lg font-medium text-gray-900">Novel Requests</h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowForm(true)}
            className="hidden md:block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            + New Request
          </button>
        )}
      </header>
      
      {!isAuthenticated && (
        <p className="text-sm text-blue-600 -mt-1 mb-2">
          Create account to request and vote!
        </p>
      )}

      {showForm && (
        <div className="relative z-50">
          <RequestForm onSubmit={handleNewRequest} onClose={() => setShowForm(false)} />
        </div>
      )}

      <section className="divide-y divide-gray-100">
        {requests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            onVote={(votes, hasVoted) => handleVoteUpdate(request.id, votes, hasVoted)}
          />
        ))}

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="mdi:book-plus-outline" className="text-4xl text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              No novel requests yet. {isAuthenticated ? 'Be the first to request a novel!' : 'Create an account to make the first request!'}
            </p>
          </div>
        )}
      </section>

      {isAuthenticated && (
        <button
          aria-label="New Request"
          onClick={() => setShowForm(true)}
          className="fixed right-4 bottom-4 md:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon icon="mdi:plus" className="text-2xl" />
        </button>
      )}
    </main>
  );
} 