'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NovelRequest, getNovelRequests, createNovelRequest, toggleVote } from '@/services/novelRequestService';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';
import Image from 'next/image';

const RequestForm = ({ onSubmit, onClose }: { onSubmit: (request: NovelRequest) => void, onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const request = await createNovelRequest(title, author, description, originalLanguage, coverImage);
      if (request) {
        onSubmit(request);
        setTitle('');
        setAuthor('');
        setDescription('');
        setOriginalLanguage('');
        setCoverImage('');
        toast.success('Novel request submitted successfully!');
      }
    } catch (error: unknown) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 md:relative md:bg-transparent">
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-xl p-4 md:relative md:rounded-lg md:p-6">
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h3 className="text-lg font-medium">New Request</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 -mr-2">
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Novel Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-base"
            />

            <input
              type="text"
              placeholder="Original Author *"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-base"
            />

            <input
              type="url"
              placeholder="Cover Image URL (optional)"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-base"
            />

            <select
              aria-label="Original Language"
              value={originalLanguage}
              onChange={(e) => setOriginalLanguage(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-base bg-white"
            >
              <option value="">Select Language *</option>
              <option value="Chinese">Chinese</option>
              <option value="Korean">Korean</option>
              <option value="Japanese">Japanese</option>
              <option value="Other">Other</option>
            </select>

            <textarea
              placeholder="Brief description of the novel *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-base resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

const RequestCard = ({ request, onVote }: { 
  request: NovelRequest; 
  onVote: (votes: number, hasVoted: boolean) => void 
}) => {
  const { isAuthenticated } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(request.hasVoted);
  const [localVotes, setLocalVotes] = useState(request.votes);

  useEffect(() => {
    setLocalHasVoted(request.hasVoted);
    setLocalVotes(request.votes);
  }, [request.hasVoted, request.votes]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote');
      return;
    }

    setIsVoting(true);
    try {
      const response = await toggleVote(request.id);
      if (response.success) {
        const newHasVoted = !localHasVoted;
        const newVotes = localHasVoted ? localVotes - 1 : localVotes + 1;
        
        setLocalHasVoted(newHasVoted);
        setLocalVotes(newVotes);
        onVote(response.votes, response.hasVoted);
        
        toast.success(newHasVoted ? 'Vote added' : 'Vote removed');
      } else {
        toast.error('Failed to vote. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error voting on request:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to vote. Please try again.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex gap-4 py-6 border-b border-gray-100 last:border-0">
      <div className="w-20 h-28 md:w-24 md:h-36 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
        {request.coverImage ? (
          <Image
            src={request.coverImage}
            alt={`Cover for ${request.title}`}
            width={96}
            height={144}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/96x144?text=No+Cover';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2">
            <Icon icon="mdi:book-outline" className="text-2xl mb-1" />
            <span className="text-[10px] text-center">No Cover</span>
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
        
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mt-2">
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

  const fetchRequests = async () => {
    const data = await getNovelRequests();
    setRequests(data);
  };

  const handleVoteUpdate = (requestId: string, votes: number, hasVoted: boolean) => {
    setRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId 
          ? { ...request, votes, hasVoted }
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
    <div className="max-w-2xl mx-auto px-4 pb-20 md:pb-8">
      <div className="sticky top-0 z-10 flex items-center justify-between py-4 bg-white/95 backdrop-blur-sm">
        <h2 className="text-xl font-medium text-gray-900">Novel Requests</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="hidden md:block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          + New Request
        </button>
      </div>

      {showForm && (
        <div className="relative z-50">
          <RequestForm onSubmit={handleNewRequest} onClose={() => setShowForm(false)} />
        </div>
      )}

      <div className="divide-y divide-gray-100">
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
              No novel requests yet. Be the first to request a novel!
            </p>
          </div>
        )}
      </div>

      <button
        aria-label="vote"
        onClick={() => setShowForm(true)}
        className="fixed right-4 bottom-4 md:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Icon icon="mdi:plus" className="text-2xl" />
      </button>
    </div>
  );
} 