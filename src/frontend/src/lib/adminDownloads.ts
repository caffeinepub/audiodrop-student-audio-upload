/**
 * Helper function for admin submission downloads
 */

import { ExternalBlob } from '../backend';

export interface DownloadSubmissionParams {
  submissionId: bigint;
  actor: any;
}

/**
 * Downloads a submission file for admin users
 * Calls backend adminDownloadSubmission endpoint and triggers browser download
 * Enforces MP3 download semantics: audio/mpeg MIME type and <submissionId>.mp3 filename
 */
export async function downloadSubmission({ submissionId, actor }: DownloadSubmissionParams): Promise<void> {
  if (!actor) {
    throw new Error('Actor not available');
  }

  try {
    // Call backend download endpoint
    const response = await actor.adminDownloadSubmission(submissionId);

    // Handle response variants
    if (response.__kind__ === 'forbidden') {
      throw new Error('Access denied: Admin session required');
    }

    if (response.__kind__ === 'notFound') {
      throw new Error('Submission not found');
    }

    if (response.__kind__ !== 'ok') {
      throw new Error('Failed to download submission');
    }

    const { data } = response.ok;

    // Fetch bytes from ExternalBlob (the actual stored MP3 bytes)
    const bytes = await data.getBytes();

    if (!bytes || bytes.length === 0) {
      throw new Error('Downloaded file is empty');
    }

    // Enforce MP3 download semantics
    const mimeType = 'audio/mpeg';
    const downloadFilename = `${submissionId}.mp3`;

    // Create blob with MP3 MIME type and trigger download
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
