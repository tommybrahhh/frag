/**
 * Formats a date string into a precise relative time string.
 * Examples: "Just now", "45m ago", "1h 23m ago", "2d ago"
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  // For older dates, return the locale date
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
  });
};
