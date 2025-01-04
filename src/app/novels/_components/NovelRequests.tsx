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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className="flex gap-4 py-6 border-b border-border last:border-0">
      <div className="w-24 h-36 md:w-28 md:h-40 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
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
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2">
            <Icon icon="mdi:book-outline" className="text-3xl mb-1" />
            <span className="text-xs text-center">No Cover</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-base text-foreground leading-tight">
              {request.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">by {request.author}</p>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`relative p-2 rounded-lg transition-colors
                ${localHasVoted 
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-500' 
                  : 'active:bg-accent text-muted-foreground'
                }`}
              title={isAuthenticated ? 'Vote for this novel' : 'Sign in to vote'}
            >
              <Icon
                icon={localHasVoted ? "pepicons-print:heart-filled" : "pepicons-print:heart"}
                className="text-xl transition-transform active:scale-90"
              />
              {isVoting && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <span className={`text-sm font-medium tabular-nums
              ${localHasVoted ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              {localVotes}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <p className={`text-sm text-muted-foreground leading-relaxed mt-2 ${
            isExpanded ? '' : 'line-clamp-3 md:line-clamp-2'
          }`}>
            {request.description}
          </p>
          {request.description.length > 150 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-primary hover:text-primary/80 text-sm mt-1"
            >
              Read more
            </button>
          )}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary hover:text-primary/80 text-sm mt-1"
            >
              Show less
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
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
        <h2 className="text-lg font-medium text-foreground flex-1 text-center">Vote for Novels for us to Translate</h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowForm(true)}
            className="hidden md:block px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors"
          >
            + New Request
          </button>
        )}
      </header>
      
      {!isAuthenticated && (
        <p className="text-sm text-primary -mt-1 mb-2 text-center">
          Create account to request and vote!
        </p>
      )}

      {showForm && (
        <div className="relative z-50">
          <RequestForm onSubmit={handleNewRequest} onClose={() => setShowForm(false)} />
        </div>
      )}

      <section className="divide-y divide-border">
        {requests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            onVote={(votes, hasVoted) => handleVoteUpdate(request.id, votes, hasVoted)}
          />
        ))}

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="mdi:book-plus-outline" className="text-4xl text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No novel requests yet. {isAuthenticated ? 'Be the first to request a novel!' : 'Create an account to make the first request!'}
            </p>
          </div>
        )}
      </section>

      {isAuthenticated && (
        <button
          aria-label="New Request"
          onClick={() => setShowForm(true)}
          className="fixed right-4 bottom-4 md:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon icon="mdi:plus" className="text-2xl" />
        </button>
      )}
    </main>
  );
} 