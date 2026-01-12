import React from 'react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useJobHoverData, 
  useCandidateHoverData, 
  useAdminUserHoverData
} from '@/hooks/useHoverCard';
import { 
  JobHoverInfo,
  CandidateHoverInfo,
  AdminUserHoverInfo
} from '@/lib/supabase/api/hover-card';
import { HoverEntity } from '@/lib/supabase/api/hover-card';
import { formatDate } from '@/lib/date-formatter';
import { cn } from '@/lib/utils';

interface GenericHoverCardProps {
  entity: HoverEntity;
  entityId: string;
  children: React.ReactNode;
  className?: string;
}

const GenericHoverCard: React.FC<GenericHoverCardProps> = ({ 
  entity, 
  entityId, 
  children, 
  className 
}) => {
  // Determine which hook to use based on entity type
  const {
    data: hoverData,
    isLoading,
    isError,
    refetch
  } = (() => {
    switch (entity) {
      case 'job':
        return useJobHoverData(entityId, { enabled: false });
      case 'candidate':
        return useCandidateHoverData(entityId, { enabled: false });
      case 'admin':
        return useAdminUserHoverData(entityId, { enabled: false });
      default:
        throw new Error('Invalid entity type');
    }
  })();

  const handleOpenChange = (open: boolean) => {
    if (open && !hoverData && !isLoading) {
      refetch();
    }
  };

  // Render skeleton while loading
  if (isLoading) {
    return (
      <HoverCard onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className={cn("w-80", className)}>
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Render error state if there's an error
  if (isError) {
    return (
      <HoverCard onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className={cn("w-80", className)}>
          <div className="text-red-500 text-sm">Failed to load hover data</div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Render job hover content
  if (entity === 'job' && hoverData) {
    const jobData = hoverData as JobHoverInfo;
    return (
      <HoverCard onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className={cn("w-80", className)}>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-semibold text-sm truncate max-w-[200px]">{jobData.title}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {jobData.status?.toLowerCase().replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(jobData.created_at)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground mr-2">Applications:</span>
              <span className="font-medium">{jobData.total_applications}</span>
            </div>
            
            {jobData.subjects && jobData.subjects.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {jobData.subjects.slice(0, 3).map((subject: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                  {jobData.subjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{jobData.subjects.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {jobData.grade_levels && jobData.grade_levels.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Grade Levels</p>
                <div className="flex flex-wrap gap-1">
                  {jobData.grade_levels.slice(0, 3).map((level: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {level}
                    </Badge>
                  ))}
                  {jobData.grade_levels.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{jobData.grade_levels.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {jobData.salary_range && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Salary</p>
                <p className="text-sm">{jobData.salary_range}</p>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Render candidate hover content
  if (entity === 'candidate' && hoverData) {
    const candidateData = hoverData as CandidateHoverInfo;
    return (
      <HoverCard onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className={cn("w-80", className)}>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={candidateData.avatar || ''} />
                <AvatarFallback>
                  {candidateData.first_name?.charAt(0)}
                  {candidateData.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">
                  {candidateData.first_name} {candidateData.last_name}
                </h4>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {candidateData.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Applied for</p>
              <p className="font-medium">{candidateData.job_title}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  {candidateData.status?.toLowerCase().replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(candidateData.created_at)}
                </span>
              </div>
              
              {candidateData.score !== null && (
                <Badge variant="outline" className="text-xs">
                  Score: {candidateData.score}
                </Badge>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Render admin user hover content
  if (entity === 'admin' && hoverData) {
    const userData = hoverData as AdminUserHoverInfo;
    return (
      <HoverCard onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className={cn("w-80", className)}>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData.avatar || ''} />
                <AvatarFallback>
                  {userData.first_name?.charAt(0)}
                  {userData.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">
                  {userData.first_name} {userData.last_name}
                </h4>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {userData.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs capitalize">
                {userData.role?.toLowerCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Joined {formatDate(userData.created_at)}
              </span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Default fallback
  return (
    <HoverCard onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className={cn("w-80", className)}>
        <div className="text-sm">No data available</div>
      </HoverCardContent>
    </HoverCard>
  );
};

export { GenericHoverCard };