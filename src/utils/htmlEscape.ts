/**
 * Shared HTML-escaping helper. Used by every place that injects
 * user/AI/imported-controlled strings into a raw HTML string we generate
 * ourselves (exported reports, certificates) instead of relying on React's
 * JSX escaping.
 */
export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
