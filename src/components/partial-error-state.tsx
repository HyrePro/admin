import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PartialErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  severity?: 'info' | 'warning' | 'error';
}

const PartialErrorState: React.FC<PartialErrorStateProps> = ({
  title = 'Partial Data Issue',
  message,
  onRetry,
  showRetryButton = true,
  severity = 'warning',
}) => {
  const getSeverityColors = () => {
    switch (severity) {
      case 'error':
        return { icon: '❌', border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' };
      case 'info':
        return { icon: 'ℹ️', border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'warning':
      default:
        return { icon: '⚠️', border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700' };
    }
  };

  const colors = getSeverityColors();

  return (
    <div className={`p-4 rounded-md border ${colors.border} ${colors.bg} ${colors.text} mb-4`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm mt-1">{message}</p>
          {showRetryButton && onRetry && (
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartialErrorState;