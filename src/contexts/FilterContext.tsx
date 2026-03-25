import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SearchFilters } from '../components/layout/SearchModal';

interface FilterContextType {
  filters: SearchFilters;
  updateFilters: (filters: SearchFilters) => void;
  sportFilter: string;
  contentFilter: string;
  newsFilter: string;
  scheduleFilter: string;
  resultsFilter: string;
  resultsSubFilter: string;
  circlesFilter: string;
}

const defaultFilters: SearchFilters = {
  searchFilter: 'all',
  sportFilter: 'all',
  contentFilter: 'players',
  scheduleFilter: 'my',
  resultsFilter: 'my',
  resultsSubFilter: 'matches',
  circlesFilter: 'people',
  newsFilter: 'all',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilters,
        sportFilter: filters.sportFilter,
        contentFilter: filters.contentFilter || 'players',
        newsFilter: filters.newsFilter || 'all',
        scheduleFilter: filters.scheduleFilter || 'my',
        resultsFilter: filters.resultsFilter || 'my',
        resultsSubFilter: filters.resultsSubFilter || 'matches',
        circlesFilter: filters.circlesFilter || 'people',
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
