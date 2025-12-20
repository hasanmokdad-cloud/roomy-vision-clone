import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type TransitionDirection = 'left' | 'right' | null;

interface PageTransitionContextType {
  direction: TransitionDirection;
  previousPath: string | null;
  currentTabIndex: number;
  setDirection: (dir: TransitionDirection) => void;
  setPreviousPath: (path: string | null) => void;
  setCurrentTabIndex: (index: number) => void;
  navigateWithDirection: (targetIndex: number, currentIndex: number) => TransitionDirection;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<TransitionDirection>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [currentTabIndex, setCurrentTabIndex] = useState<number>(2); // Default to listings (center)

  const navigateWithDirection = useCallback((targetIndex: number, currentIndex: number): TransitionDirection => {
    const dir = targetIndex > currentIndex ? 'left' : 'right';
    setDirection(dir);
    setCurrentTabIndex(targetIndex);
    return dir;
  }, []);

  return (
    <PageTransitionContext.Provider
      value={{
        direction,
        previousPath,
        currentTabIndex,
        setDirection,
        setPreviousPath,
        setCurrentTabIndex,
        navigateWithDirection,
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
}
