import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  pageSize: number;
  onPageSizeChange: (newPageSize: number) => void;
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
  pageSize,
  onPageSizeChange,
  translations,
  jobSearchInputRef
}) => {
  console.log('JobsPagination:', { 
    currentPage, 
    totalPages, 
    startIndex, 
    endIndex, 
    totalDisplayCount, 
    hasNextPage, 
    hasPreviousPage,
    isFetchingNextPage 
  });

  return (
    <div 
      className="pagination-container flex-shrink-0 w-full flex items-center justify-between gap-4 py-2" 
      role="navigation" 
      aria-label="Pagination"
    >
      <div className="pagination-info flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 justify-between">
        <span className="text-sm">
          {translations.pagination.showing} <span className="pagination-value">{formatNumber(startIndex + 1)}</span> {translations.pagination.to}{' '}
          <span className="pagination-value">{formatNumber(endIndex || 0)}</span> {translations.pagination.of}{' '}
          <span className="pagination-value">{formatNumber(totalDisplayCount)}</span> {translations.pagination.jobs}
        </span>
        <span className="sr-only">{translations.pagination.page} {currentPage + 1} {translations.pagination.ofTotal} {totalPages || 1}</span>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pagination-controls flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadPrevious}
          disabled={!hasPreviousPage}
          className="pagination-btn"
          aria-label={translations.common.previous + " page"}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && e.shiftKey) {
              e.preventDefault();
            }
          }}
        >
          <ChevronLeft className="btn-icon" />
          <span className="hidden sm:inline-block ml-2">{translations.common.previous}</span>
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
              e.preventDefault();
              if (jobSearchInputRef?.current) {
                jobSearchInputRef.current.focus();
              }
            }
          }}
        >
          <span className="hidden sm:inline-block mr-2">{isFetchingNextPage ? translations.common.loading + "..." : translations.common.loadMore}</span>
          <ChevronRight className="btn-icon" />
        </Button>
      </div>
    </div>
  );
};

export { JobsPagination };