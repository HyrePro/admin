import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/number-formatter';

interface JobsPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalDisplayCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  translations: {
    common: {
      previous: string;
      loadMore: string;
      loading: string;
    };
    pagination: {
      showing: string;
      to: string;
      of: string;
      jobs: string;
      page: string;
      ofTotal: string;
    };
  };
  jobSearchInputRef?: React.RefObject<HTMLInputElement>;
}

const JobsPagination: React.FC<JobsPaginationProps> = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalDisplayCount,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage = false,
  onLoadMore,
  onLoadPrevious,
  translations,
  jobSearchInputRef
}) => {
  return (
    <div className="pagination-container" style={{ zIndex: 20, marginTop: 8 }} role="navigation" aria-label="Pagination">
      <div className="pagination-info" aria-live="polite">
        {translations.pagination.showing} <span className="pagination-value">{formatNumber(startIndex + 1)}</span> {translations.pagination.to}{' '}
        <span className="pagination-value">{formatNumber(endIndex || 0)}</span> {translations.pagination.of}{' '}
        <span className="pagination-value">{formatNumber(totalDisplayCount)}</span> {translations.pagination.jobs}
        <span className="sr-only">{translations.pagination.page} {currentPage + 1} {translations.pagination.ofTotal} {totalPages || 1}</span>
      </div>
      <div className="pagination-controls">
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadPrevious}
          disabled={!hasPreviousPage}
          className="pagination-btn"
          aria-label={translations.common.previous + " page"}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && e.shiftKey) {
              // If shift+tab on first pagination button, move to last element in table
              e.preventDefault();
              // We would need to access the table rows here, but for now we'll just prevent default
            }
          }}
        >
          <ChevronLeft className="btn-icon" />
          {translations.common.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={!hasNextPage || isFetchingNextPage}
          className="pagination-btn"
          aria-label={isFetchingNextPage ? translations.common.loading + " more jobs" : translations.common.loadMore}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              // If tab on last pagination button, move to first element (search input)
              e.preventDefault();
              if (jobSearchInputRef?.current) {
                jobSearchInputRef.current.focus();
              }
            }
          }}
        >
          {isFetchingNextPage ? translations.common.loading + "..." : translations.common.loadMore}
          <ChevronRight className="btn-icon" />
        </Button>
      </div>
    </div>
  );
};

export { JobsPagination };