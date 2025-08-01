import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface TL {
  username: string;
  role: string;
}

interface TLSelectorProps {
  selectedTLs: string[];
  onTLSelect: (tlUsername: string) => void;
  onTLRemove: (tlUsername: string) => void;
}

export default function TLSelector({
  selectedTLs,
  onTLSelect,
  onTLRemove,
}: TLSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [tls, setTLs] = useState<TL[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch TLs when dropdown opens or search changes
  useEffect(() => {
    if (!showDropdown && !search) return;

    const fetchTLs = async () => {
      setIsLoading(true);
      try {
        const query = search.trim() || '';
        const response = await fetch(`/api/authors?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch TLs');
        const data = await response.json();
        setTLs(data);
      } catch (error) {
        console.error('Error fetching TLs:', error);
        setTLs([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchTLs, 300);
    return () => clearTimeout(timeoutId);
  }, [search, showDropdown]);

  // Filter TLs based on search (client-side filtering for better UX)
  const filteredTLs = React.useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    return searchTerm
      ? tls.filter(tl => 
          tl.username.toLowerCase().includes(searchTerm)
        )
      : tls;
  }, [search, tls]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected TLs */}
      {selectedTLs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTLs.map(tlUsername => (
            <div key={tlUsername} className="group flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors">
              <Icon icon="material-symbols:translate" className="w-3.5 h-3.5" />
              <span>{tlUsername}</span>
              <button
                onClick={() => onTLRemove(tlUsername)}
                className="opacity-75 group-hover:opacity-100 hover:text-primary/80 transition-all"
                aria-label={`Remove ${tlUsername}`}
              >
                <Icon icon="material-symbols:close" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Icon 
            icon="material-symbols:translate" 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" 
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search translators..."
            className="w-full pl-10 pr-10 py-2 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon 
              icon={showDropdown ? "material-symbols:keyboard-arrow-up" : "material-symbols:keyboard-arrow-down"} 
              className="w-4 h-4" 
            />
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading translators...</span>
              </div>
            ) : filteredTLs.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {search.trim() ? 'No translators found' : 'Start typing to search translators'}
              </div>
            ) : (
              <div className="py-1">
                {filteredTLs.map((tl) => {
                  const isSelected = selectedTLs.includes(tl.username);
                  return (
                    <button
                      key={tl.username}
                      onClick={() => {
                        if (!isSelected) {
                          onTLSelect(tl.username);
                        }
                        setShowDropdown(false);
                        setSearch('');
                      }}
                      disabled={isSelected}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                        isSelected
                          ? 'bg-primary/10 text-primary cursor-not-allowed opacity-60'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{tl.username}</div>
                      </div>
                      {isSelected && (
                        <Icon icon="material-symbols:check" className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}