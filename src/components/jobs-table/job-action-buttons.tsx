import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface JobActionButtonsProps {
  jobId: string;
  onCopyLink: (jobId: string) => Promise<void>;
  onViewJob: (jobId: string) => void;
  onUndo?: () => void;
  translations: {
    actions: {
      copyLink: string;
      viewJob: string;
    };
  };
  showUndo?: boolean;
}

const JobActionButtons: React.FC<JobActionButtonsProps> = ({
  jobId,
  onCopyLink,
  onViewJob,
  onUndo,
  translations,
  showUndo = false
}) => {
  return (
    <div className="flex justify-end gap-2">
      {showUndo && onUndo && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
            >
              ↶ Undo
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo last action</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyLink(jobId)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{translations.actions.copyLink}</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewJob(jobId)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{translations.actions.viewJob}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export { JobActionButtons };