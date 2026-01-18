import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { searchPerfumesService, getPopularPerfumesService, SearchResult } from '@/lib/services/search';

interface UsePerfumeSearchOptions {
  debounceMs?: number;
}

export function usePerfumeSearch({ debounceMs = 300 }: UsePerfumeSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize client
  const supabase = useMemo(() => createClient(), []);

  // 1. Load Initial Suggestions (Popular)
  useEffect(() => {
    let mounted = true;
    getPopularPerfumesService(supabase)
      .then(data => {
        if (mounted) setSuggestions(data);
      })
      .catch(err => console.error('Failed to load suggestions', err));
    
    return () => { mounted = false; };
  }, [supabase]);

  // 2. Handle Search Side Effects
  useEffect(() => {
    // If query is too short, reset and stop.
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const data = await searchPerfumesService(supabase, query, controller.signal);
        setResults(data);
        setError(null);
      } catch (err: any) {
        // Only set error if it wasn't a cancellation
        if (err.name !== 'AbortError') {
          console.error('Search hook error:', err);
          setError('Failed to search perfumes');
          setResults([]); // Clear results on error so user doesn't see stale data
        }
      } finally {
        // Only stop loading if we weren't aborted (meaning this was the latest request)
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    // Cleanup: Abort previous request and clear timeout
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, supabase, debounceMs]);

  // Public Interface
  return {
    query,
    setQuery,
    results,
    suggestions,
    isLoading,
    error,
    hasResults: results.length > 0,
    displayList: query.length >= 2 ? results : suggestions,
    listLabel: query.length >= 2 ? (results.length === 0 ? "No matches" : "Results") : "Popular Now"
  };
}
