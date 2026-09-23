import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title with app branding.
 * @param {string} title Page title
 * @param {string} baseTitle Base app title suffix
 */
export function useDocumentTitle(title, baseTitle = 'ResolveNow') {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${title} — ${baseTitle}`;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title, baseTitle]);
}

export default useDocumentTitle;
