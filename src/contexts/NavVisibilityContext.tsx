import { createContext, useContext, useState, type ReactNode } from 'react';

interface NavVisibilityContextValue {
  hideNav: boolean;
  setHideNav: (v: boolean) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextValue>({
  hideNav: false,
  setHideNav: () => {},
});

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [hideNav, setHideNav] = useState(false);
  return (
    <NavVisibilityContext.Provider value={{ hideNav, setHideNav }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  return useContext(NavVisibilityContext);
}
