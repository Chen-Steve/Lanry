import React, { useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onMatchUpdate?: (matches: { start: number; end: number }[]) => void;
  onDraftChange?: (draft: string) => void;
}

interface FindReplaceState {
  searchText: string;
  replaceText: string;
  currentMatch: number;
  matches: number[];
  draftValue: string;
}

export default function FindReplaceOverlay({ 
  isOpen, 
  onClose, 
  value, 
  onMatchUpdate,
  onDraftChange
}: FindReplaceProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = React.useState<FindReplaceState>({
    searchText: '',
    replaceText: '',
    currentMatch: -1,
    matches: [],
    draftValue: value
  });

  // Update draft value when main value changes
  useEffect(() => {
    setState(prev => ({ ...prev, draftValue: value }));
  }, [value]);

  // Sync changes back to parent component
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(state.draftValue);
    }
  }, [state.draftValue, onDraftChange]);

  const findAllMatches = (searchText: string) => {
    if (!searchText) return [];
    const matches: number[] = [];
    let index = -1;
    while ((index = state.draftValue.indexOf(searchText, index + 1)) !== -1) {
      matches.push(index);
    }
    return matches;
  };

  // Update matches in parent component for highlighting
  useEffect(() => {
    if (onMatchUpdate) {
      const matchRanges = state.matches.map(start => ({
        start,
        end: start + state.searchText.length
      }));
      onMatchUpdate(matchRanges);
    }
  }, [state.matches, state.searchText, onMatchUpdate]);

  const handleSearch = (searchText: string) => {
    const matches = findAllMatches(searchText);
    setState(prev => ({
      ...prev,
      searchText,
      matches,
      currentMatch: matches.length > 0 ? 0 : -1
    }));
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!state.searchText || state.currentMatch === -1) return;

    const matchStart = state.matches[state.currentMatch];
    const matchEnd = matchStart + state.searchText.length;
    const newText = state.draftValue.substring(0, matchStart) + 
                   state.replaceText + 
                   state.draftValue.substring(matchEnd);

    // Update draft value and parent
    setState(prev => ({ ...prev, draftValue: newText }));
    if (onDraftChange) onDraftChange(newText);

    // Update matches after replace
    const newMatches = findAllMatches(state.searchText);
    setState(prev => ({
      ...prev,
      matches: newMatches,
      currentMatch: newMatches.length > 0 ? Math.min(prev.currentMatch, newMatches.length - 1) : -1
    }));
  };

  const handleReplaceAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!state.searchText) return;
    const newText = state.draftValue.replaceAll(state.searchText, state.replaceText);
    
    // Update draft value and parent
    setState(prev => ({ ...prev, draftValue: newText }));
    if (onDraftChange) onDraftChange(newText);

    setState(prev => ({
      ...prev,
      matches: [],
      currentMatch: -1
    }));
  };

  const navigateMatches = (direction: 'next' | 'prev') => {
    if (state.matches.length === 0) return;

    const newMatch = direction === 'next'
      ? (state.currentMatch + 1) % state.matches.length
      : (state.currentMatch - 1 + state.matches.length) % state.matches.length;

    setState(prev => ({ ...prev, currentMatch: newMatch }));
  };

  // Focus search input when overlay opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted border border-border rounded-lg mb-2 relative z-10" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <input
          ref={searchInputRef}
          type="text"
          value={state.searchText}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Find..."
          className="p-1 text-sm border border-border rounded bg-background w-40"
        />
        <input
          type="text"
          value={state.replaceText}
          onChange={(e) => setState(prev => ({ ...prev, replaceText: e.target.value }))}
          placeholder="Replace with..."
          className="p-1 text-sm border border-border rounded bg-background w-40"
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigateMatches('prev')}
          className="p-1 hover:bg-accent/50 rounded transition-colors"
          disabled={state.matches.length === 0}
          title="Previous match"
          type="button"
        >
          <Icon icon="mdi:chevron-up" className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigateMatches('next')}
          className="p-1 hover:bg-accent/50 rounded transition-colors"
          disabled={state.matches.length === 0}
          title="Next match"
          type="button"
        >
          <Icon icon="mdi:chevron-down" className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground mx-1">
          {state.matches.length > 0 
            ? `${state.currentMatch + 1}/${state.matches.length}`
            : 'No matches'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleReplace}
          className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
          disabled={state.matches.length === 0}
          type="button"
        >
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
          disabled={state.matches.length === 0}
          type="button"
        >
          Replace All
        </button>
        <div className="w-px h-4 bg-border mx-2" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="p-1 hover:bg-accent/50 rounded transition-colors"
          title="Close find/replace"
          type="button"
        >
          <Icon icon="mdi:close" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 