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
