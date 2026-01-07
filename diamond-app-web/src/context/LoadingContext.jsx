import React, { createContext, useContext, useEffect, useState } from 'react';
import ThemedFullPageLoader from '../components/FullPageLoader';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      const c = e?.detail?.count ?? 0;
      setCount(c);
    };
    window.addEventListener('app-loader', handler);
    // sync initial
    const existing = window.__app_loader_count ?? 0;
    setCount(existing);
    return () => window.removeEventListener('app-loader', handler);
  }, []);

  return (
    <LoadingContext.Provider value={{ loadingCount: count, isLoading: count > 0 }}>
      {children}
      {count > 0 && <ThemedFullPageLoader />}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;
