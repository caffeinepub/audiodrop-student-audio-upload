export function sanitizeText(text: string): string {
  // Remove any HTML tags and trim whitespace
  return text.replace(/<[^>]*>/g, '').trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
