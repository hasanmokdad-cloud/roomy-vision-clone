import { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';

interface ActiveConversationContextType {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeConversationIdRef: React.RefObject<string | null>;
}

const ActiveConversationContext = createContext<ActiveConversationContextType | undefined>(undefined);

export function ActiveConversationProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationIdRef.current = id;
    setActiveConversationIdState(id);
  }, []);

  return (
    <ActiveConversationContext.Provider value={{ 
      activeConversationId, 
      setActiveConversationId,
      activeConversationIdRef 
    }}>
      {children}
    </ActiveConversationContext.Provider>
  );
}

export function useActiveConversation() {
  const context = useContext(ActiveConversationContext);
  if (context === undefined) {
    throw new Error('useActiveConversation must be used within an ActiveConversationProvider');
  }
  return context;
}
