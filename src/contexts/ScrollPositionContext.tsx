import { createContext, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';

interface ScrollPositionContextType {
  saveScrollPosition: (path: string, position: number) => void;
  getScrollPosition: (path: string) => number;
  clearScrollPosition: (path: string) => void;
}

const ScrollPositionContext = createContext<ScrollPositionContextType | null>(null);

const STORAGE_KEY = 'scroll-positions';
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface StoredPosition {
  position: number;
  timestamp: number;
}

export function ScrollPositionProvider({ children }: { children: ReactNode }) {
  const positionsRef = useRef<Map<string, StoredPosition>>(new Map());

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, StoredPosition>;
        const now = Date.now();
        
        // Only keep non-expired entries
        Object.entries(parsed).forEach(([path, data]) => {
          if (now - data.timestamp < MAX_AGE_MS) {
            positionsRef.current.set(path, data);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load scroll positions', e);
    }
  }, []);

  // Save to sessionStorage when positions change
  const persistPositions = useCallback(() => {
    try {
      const obj: Record<string, StoredPosition> = {};
      positionsRef.current.forEach((value, key) => {
        obj[key] = value;
      });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save scroll positions', e);
    }
  }, []);

  const saveScrollPosition = useCallback((path: string, position: number) => {
    positionsRef.current.set(path, { position, timestamp: Date.now() });
    persistPositions();
  }, [persistPositions]);

  const getScrollPosition = useCallback((path: string): number => {
    const data = positionsRef.current.get(path);
    if (!data) return 0;
    
    // Check if expired
    if (Date.now() - data.timestamp > MAX_AGE_MS) {
      positionsRef.current.delete(path);
      persistPositions();
      return 0;
    }
    
    return data.position;
  }, [persistPositions]);

  const clearScrollPosition = useCallback((path: string) => {
    positionsRef.current.delete(path);
    persistPositions();
  }, [persistPositions]);

  return (
    <ScrollPositionContext.Provider value={{ saveScrollPosition, getScrollPosition, clearScrollPosition }}>
      {children}
    </ScrollPositionContext.Provider>
  );
}

export function useScrollPosition() {
  const context = useContext(ScrollPositionContext);
  if (!context) {
    throw new Error('useScrollPosition must be used within a ScrollPositionProvider');
  }
  return context;
}
