import { createContext, useContext, useState, type ReactNode } from 'react';

interface FullscreenContextValue {
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextValue>({
  isFullscreen: false,
  setIsFullscreen: () => {},
});

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  return (
    <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  return useContext(FullscreenContext);
}
