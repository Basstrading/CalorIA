import { useCallback, useRef, useState } from 'react';
import type { FoodDatabaseEntry } from '../types';
import { searchCiqual } from '../lib/ciqual';
import { searchOpenFoodFacts } from '../lib/openfoodfacts';

interface UseFoodSearchReturn {
  results: FoodDatabaseEntry[];
  loading: boolean;
  search: (query: string) => void;
  clear: () => void;
}

export function useFoodSearch(): UseFoodSearchReturn {
  const [results, setResults] = useState<FoodDatabaseEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Anti-stale: track the latest query to ignore outdated responses
  const latestQueryRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = useCallback(() => {
    latestQueryRef.current = '';
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setLoading(false);
  }, []);

  const search = useCallback((query: string) => {
    const trimmed = query.trim();
    latestQueryRef.current = trimmed;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Phase 1: Ciqual — instant
    searchCiqual(trimmed, 5).then((ciqualResults) => {
      if (latestQueryRef.current !== trimmed) return;
      setResults(ciqualResults);
    });

    // Phase 2: Open Food Facts — debounced 400ms
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchOpenFoodFacts(trimmed, 5).then((offResults) => {
        if (latestQueryRef.current !== trimmed) return;

        setResults((prev) => {
          // Deduplicate: don't add OFF results whose name (lowercased) already exists in Ciqual results
          const existingNames = new Set(
            prev
              .filter((r) => r.source === 'ciqual')
              .map((r) => r.name.toLowerCase()),
          );
          const newResults = offResults.filter(
            (r) => !existingNames.has(r.name.toLowerCase()),
          );
          return [...prev.filter((r) => r.source === 'ciqual'), ...newResults];
        });
        setLoading(false);
      }).catch(() => {
        if (latestQueryRef.current === trimmed) setLoading(false);
      });
    }, 400);
  }, []);

  return { results, loading, search, clear };
}
