import type { DownloadResponse } from '../backend';
import { downloadFile } from './downloads';
import { inferMimeType } from './mediaMime';

export interface AdminDownloadResult {
  success: boolean;
  error?: string;
}

/**
 * Downloads a submission file via the backend adminDownloadSubmission endpoint
 * @param actor - The backend actor instance
 * @param submissionId - The submission ID to download
 * @returns Result object with success status and optional error message
 */
export async function downloadSubmission(
  actor: any,
  submissionId: bigint
): Promise<AdminDownloadResult> {
  try {
    const response: DownloadResponse = await actor.adminDownloadSubmission(submissionId);

    if (response.__kind__ === 'forbidden') {
      return {
        success: false,
        error: 'You do not have permission to download this file. Admin access required.',
      };
    }

    if (response.__kind__ === 'notFound') {
      return {
        success: false,
        error: 'Submission not found. It may have been deleted.',
      };
    }

    if (response.__kind__ === 'ok') {
      const { data, originalFileName, fileType } = response.ok;
      
      // Infer MIME type from backend response fields
      const mimeType = inferMimeType(fileType, originalFileName);
      
      // Fetch real bytes from ExternalBlob
      const bytes = await data.getBytes();
      
      // Create blob from actual bytes
      const blob = new Blob([bytes], { type: mimeType });
      
      // Trigger download using the helper
      downloadFile(blob, originalFileName);
      
      return { success: true };
    }

    return {
      success: false,
      error: 'Unexpected response from server. Please try again.',
    };
  } catch (error: any) {
    console.error('Download error:', error);
    
    // Handle network and other errors
    if (error?.message?.includes('Forbidden') || error?.message?.includes('Admin')) {
      return {
        success: false,
        error: 'You do not have permission to download this file. Admin access required.',
      };
    }
    
    if (error?.message?.includes('not found')) {
      return {
        success: false,
        error: 'Submission not found. It may have been deleted.',
      };
    }
    
    return {
      success: false,
      error: 'Failed to download file. Please check your connection and try again.',
    };
  }
}
