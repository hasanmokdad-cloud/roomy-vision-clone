import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { helpCategories, HelpArticle } from '@/data/helpArticles';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  rank?: number;
}

export function useHelpSearch(searchQuery: string) {
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side filtering as fallback/primary
  const clientResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const results: HelpArticle[] = [];

    helpCategories.forEach(category => {
      category.articles.forEach(article => {
        if (
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query)
        ) {
          results.push(article);
        }
      });
    });

    return results;
  }, [searchQuery]);

  // Database search for more comprehensive results
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setDbResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('search_help_articles', {
          search_query: searchQuery
        });

        if (rpcError) {
          console.warn('DB search failed, using client-side results:', rpcError);
          setError(rpcError.message);
        } else {
          setDbResults(data || []);
        }
      } catch (err) {
        console.warn('Search error:', err);
        setError('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  // Merge results, preferring DB results but falling back to client
  const results = useMemo(() => {
    if (dbResults.length > 0) {
      return dbResults.map(r => ({
        id: r.slug,
        title: r.title,
        content: r.content,
        category: r.category
      }));
    }
    return clientResults;
  }, [dbResults, clientResults]);

  return {
    results,
    isSearching,
    error,
    hasResults: results.length > 0
  };
}
