import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "react-toastify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Downloads a file from a URL with a specified filename
 * Uses server-side proxy to ensure proper download behavior
 */
export async function downloadFile(url: string, filename?: string) {
  if (!url) {
    console.warn('Download attempted with empty URL');
    toast.error('Cannot download: No file URL provided');
    return;
  }
  
  try {
    // Show loading toast
    const loadingToast = toast.loading('Preparing download...');
    
    // Use our API route to proxy the download
    const downloadUrl = `/api/download-resume?${new URLSearchParams({
      url: url,
      filename: filename || 'resume.pdf'
    })}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'resume.pdf';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Update loading toast to success
    toast.update(loadingToast, {
      render: `Downloading ${filename || 'resume.pdf'}...`,
      type: 'success',
      isLoading: false,
      autoClose: 2000
    });
    
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Download failed. Please try again.');
    
    // Fallback: try opening the original URL
    try {
      window.open(url, '_blank');
      toast.info('File opened in new tab. Please check your downloads.');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      toast.error('Unable to download or open file. Please contact support.');
    }
  }
}

/**
 * Alternative download method using window.location for maximum compatibility
 */
export function forceDownload(url: string, filename?: string) {
  if (!url) {
    toast.error('Cannot download: No file URL provided');
    return;
  }

  try {
    // Show loading toast
    toast.info(`Downloading ${filename || 'resume.pdf'}...`);
    
    // Use window.location to force download
    const downloadUrl = `/api/download-resume?${new URLSearchParams({
      url: url,
      filename: filename || 'resume.pdf'
    })}`;
    
    // Force navigation to download URL
    window.location.href = downloadUrl;
    
  } catch (error) {
    console.error('Force download error:', error);
    toast.error('Download failed.');
    
    // Last resort fallback
    window.open(url, '_blank');
  }
}

/**
 * Retry function with exponential backoff
 * @param fn - The function to retry
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @param backoff - Backoff multiplier (default: 2)
 * @returns Promise that resolves with the result of the function or rejects after all retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i === retries) {
        // If this was the last attempt, throw the error
        break;
      }

      // Calculate delay with exponential backoff
      const calculatedDelay = delay * Math.pow(backoff, i);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, calculatedDelay));
    }
  }

  // If all retries failed, throw the last error
  throw lastError;
}

/**
 * Check if an error is a network error
 * @param error - The error to check
 * @returns boolean indicating if it's a network error
 */
export function isNetworkError(error: any): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network error from fetch
  }
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return true; // Network error
  }
  if (error && typeof error === 'object' && error.name === 'TypeError') {
    return true; // General network/transport error
  }
  return false;
}

/**
 * Check if an error is a timeout error
 * @param error - The error to check
 * @returns boolean indicating if it's a timeout error
 */
export function isTimeoutError(error: any): boolean {
  if (error instanceof TypeError && (error.message.includes('timeout') || error.message.includes('Timeout'))) {
    return true; // Timeout error
  }
  if (error && typeof error === 'object' && error.name === 'AbortError') {
    return true; // Request was aborted (often due to timeout)
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return true; // Explicit timeout error
  }
  return false;
}
