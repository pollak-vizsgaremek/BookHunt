import { useEffect } from "react";

/**
 * Sets the browser tab title to "BookHunt | <page>"
 * Call this at the top of every page component.
 */
export function usePageTitle(page: string) {
  useEffect(() => {
    document.title = `BookHunt | ${page}`;
    return () => {
      document.title = "BookHunt";
    };
  }, [page]);
}
