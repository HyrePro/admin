import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface NetworkErrorStateProps {
  onRetry?: () => void;
  message?: string;
  showRetryButton?: boolean;
}

const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({
  onRetry,
  message = "Unable to connect to the server. Please check your internet connection and try again.",
  showRetryButton = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-6xl text-gray-300">🌐</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Network Connection Issue</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>
      {showRetryButton && onRetry && (
        <Button onClick={onRetry} className="flex items-center">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      )}
    </div>
  );
};

export default NetworkErrorState;