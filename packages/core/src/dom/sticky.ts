import { StickyProvider } from '../utils/sticky';

/**
 * Creates a StickyProvider pre-configured for the Web environment.
 */
export const createWebStickyProvider = (selector: string) => {
  return new StickyProvider(
    selector,
    (id) => document.querySelector(id), // finder
    (el) => {
      // rectProvider
      const r = (el as Element).getBoundingClientRect();
      return r;
    },
    (el) => document.contains(el as Node), // presenceChecker
  );
};
