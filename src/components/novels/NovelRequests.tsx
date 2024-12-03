'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NovelRequest, getNovelRequests, createNovelRequest, toggleVote } from '@/services/novelRequestService';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';

const RequestForm = ({ onSubmit }: { onSubmit: (request: NovelRequest) => void }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const request = await createNovelRequest(title, author, description, originalLanguage);
      if (request) {
        onSubmit(request);
        setTitle('');
        setAuthor('');
        setDescription('');
        setOriginalLanguage('');
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
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <input
        type="text"
        placeholder="Novel Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full p-2 border rounded text-black"
      />

      <input
        type="text"
        placeholder="Original Author *"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        required
        className="w-full p-2 border rounded text-black"
      />

      <select
        aria-label="Original Language"
        value={originalLanguage}
        onChange={(e) => setOriginalLanguage(e.target.value)}
        required
        className="w-full p-2 border rounded bg-white text-black"
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
        className="w-full p-2 border rounded resize-none text-base"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
};

const RequestCard = ({ request, onVote }: { request: NovelRequest; onVote: () => void }) => {
  const { isAuthenticated } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to vote');
      return;
    }

    setIsVoting(true);
    try {
      await toggleVote(request.id);
      onVote();
    } catch (error: unknown) {
      console.error('Error voting on request:', error);
      toast.error('Failed to vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex gap-3 p-3 border-b last:border-b-0">
      <button
        onClick={handleVote}
        disabled={isVoting}
        className="flex flex-col items-center"
      >
        <Icon
          icon={request.hasVoted ? "mdi:thumb-up-filled" : "mdi:thumb-up-outline"}
          className={`text-xl ${request.hasVoted ? 'text-blue-600' : 'text-gray-400'}`}
        />
        <span className="text-sm font-medium">{request.votes}</span>
      </button>

      <div className="min-w-0">
        <h3 className="font-medium text-sm">{request.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          by {request.author} • {request.originalLanguage}
        </p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
      </div>
    </div>
  );
};

export default function NovelRequests() {
  const [requests, setRequests] = useState<NovelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchRequests = async () => {
    const data = await getNovelRequests();
    setRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleNewRequest = (request: NovelRequest) => {
    setRequests(prev => [request, ...prev]);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <div className="w-12 h-12 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-black">Novel Requests</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600"
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <RequestForm onSubmit={handleNewRequest} />
        </div>
      )}

      <div className="divide-y">
        {requests.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            onVote={fetchRequests}
          />
        ))}

        {requests.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-500">
            No novel requests yet. Be the first to request a novel!
          </p>
        )}
      </div>
    </div>
  );
} 