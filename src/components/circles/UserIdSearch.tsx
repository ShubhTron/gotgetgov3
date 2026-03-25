import { useState, type FormEvent } from 'react';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  determineSearchType,
  searchUserById,
  isValidUserIdFormat,
} from '@/lib/userId';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface UserIdSearchProps {
  onSearchResult: (user: Profile | null) => void;
  onSearchError: (error: string) => void;
  onClear: () => void;
}

export function UserIdSearch({
  onSearchResult,
  onSearchError,
  onClear,
}: UserIdSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Searches for users by name pattern
   * Queries profiles where full_name contains the search query
   */
  async function searchByName(name: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${name}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  /**
   * Handles the search submission
   * Determines search type and routes to appropriate handler
   */
  async function handleSearch(e: FormEvent) {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchType = determineSearchType(trimmedQuery);

      if (searchType === 'id') {
        // Validate ID format
        if (!isValidUserIdFormat(trimmedQuery)) {
          setError('User IDs must start with # and contain 8 characters');
          setLoading(false);
          onSearchError('User IDs must start with # and contain 8 characters');
          return;
        }

        // Search by ID
        const user = await searchUserById(trimmedQuery);
        if (user) {
          onSearchResult(user);
        } else {
          const errorMsg = `No user found with ID ${trimmedQuery}`;
          setError(errorMsg);
          onSearchError(errorMsg);
          onSearchResult(null);
        }
      } else {
        // Search by name
        const users = await searchByName(trimmedQuery);
        if (users.length > 0) {
          // For now, return the first result
          onSearchResult(users[0]);
        } else {
          const errorMsg = `No users found matching "${trimmedQuery}"`;
          setError(errorMsg);
          onSearchError(errorMsg);
          onSearchResult(null);
        }
      }
    } catch (err) {
      const errorMsg =
        'Unable to search. Please check your connection and try again.';
      setError(errorMsg);
      onSearchError(errorMsg);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles clearing the search input and results
   */
  function handleClear() {
    setQuery('');
    setError(null);
    onClear();
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2"
            size={20}
            style={{ color: 'var(--color-t3)' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a User ID (#12345678) or name"
            className={cn(
              'w-full h-12 pl-12 pr-24 rounded-[12px] border',
              'text-body placeholder:text-[color:var(--color-t3)]',
              'focus:outline-none focus:ring-2 transition-colors duration-100',
              error && 'border-[color:var(--color-red)]'
            )}
            style={{
              background: 'var(--color-surf)',
              borderColor: error ? 'var(--color-red)' : 'var(--color-bdr)',
              color: 'var(--color-t1)',
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 transition-colors"
                style={{ color: 'var(--color-t3)' }}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={loading || !query.trim()}
              className="h-8"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-2 flex items-start gap-2 text-caption" style={{ color: 'var(--color-red)' }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && query && (
        <p className="mt-2 text-caption" style={{ color: 'var(--color-t2)' }}>
          {query.startsWith('#')
            ? 'Searching by User ID...'
            : 'Searching by name...'}
        </p>
      )}
    </div>
  );
}
