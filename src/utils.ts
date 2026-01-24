/**
 * Utility functions for BrowserPodEditor
 */

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Analytics callback type - users can provide their own analytics function
 */
export type AnalyticsCallback = (event: string) => void;

let analyticsCallback: AnalyticsCallback | null = null;

/**
 * Set the analytics callback function
 */
export function setAnalyticsCallback(callback: AnalyticsCallback | null): void {
  analyticsCallback = callback;
}

/**
 * Track an analytics event (if callback is set)
 */
export function trackEvent(event: string): void {
  analyticsCallback?.(event);
}
