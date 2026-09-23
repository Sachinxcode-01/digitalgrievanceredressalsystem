import { useSyncExternalStore, useCallback } from 'react';

/**
 * Custom hook to track CSS media query matches in responsive layouts.
 * Uses useSyncExternalStore for tear-free, zero-cascading-render subscription.
 * @param {string} query CSS media query string (e.g. '(min-width: 768px)')
 * @returns {boolean} Whether the media query matches
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const matchMedia = window.matchMedia(query);
      if (matchMedia.addEventListener) {
        matchMedia.addEventListener('change', callback);
        return () => matchMedia.removeEventListener('change', callback);
      }
      matchMedia.addListener(callback);
      return () => matchMedia.removeListener(callback);
    },
    [query]
  );

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMediaQuery;
