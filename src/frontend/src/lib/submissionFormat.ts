export function formatTimestamp(timestamp: bigint): { local: string; utc: string } {
  // Convert nanoseconds to milliseconds
  const ms = Number(timestamp / BigInt(1000000));
  const date = new Date(ms);

  const local = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const utc = date.toUTCString();

  return { local, utc };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateSubmissionId(): bigint {
  // Generate a random number for the submission ID
  return BigInt(Math.floor(Math.random() * 1000000000));
}

export function formatSubmissionIdDisplay(id: bigint): string {
  // Format as AD-XXXXXX for display
  const idStr = id.toString().padStart(6, '0').slice(-6);
  return `AD-${idStr}`;
}
