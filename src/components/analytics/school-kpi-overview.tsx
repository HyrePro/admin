import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChartIcon, ClockIcon, UsersIcon, TrendingUp, TrendingDown, Clock, Users } from '@/components/icons';

interface KPIData {
  totalActiveJobs: number;
  totalSuccessfulJobs: number;
  totalFailedJobs: number;
  candidatesInAssessment: number;
  candidatesInDemo: number;
  candidatesInInterview: number;
  candidatesOffered: number;
  averageTimeToHire: string;
  offeredAccepted: number;
  offeredRejected: number;
}

interface SchoolKPIOverviewProps {
  kpiData?: KPIData;
}

const SchoolKPIOverview: React.FC<SchoolKPIOverviewProps> = ({ kpiData }) => {
  // Default dummy data if no data is provided
  const data: KPIData = kpiData || {
    totalActiveJobs: 12,
    totalSuccessfulJobs: 8,
    totalFailedJobs: 3,
    candidatesInAssessment: 45,
    candidatesInDemo: 23,
    candidatesInInterview: 18,
    candidatesOffered: 12,
    averageTimeToHire: '32 days',
    offeredAccepted: 9,
    offeredRejected: 3,
  };

  return (
    <div className="space-y-6">
      {/* Jobs Section - 4 main cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Job Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Job Campaigns */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Job Campaigns</CardTitle>
              <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalActiveJobs}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          {/* Successful Job Campaigns */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Successful Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalSuccessfulJobs}</div>
              <p className="text-xs text-muted-foreground">Completed successfully</p>
            </CardContent>
          </Card>

          {/* Failed Job Campaigns */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed Campaigns</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalFailedJobs}</div>
              <p className="text-xs text-muted-foreground">Did not meet targets</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((data.totalSuccessfulJobs / (data.totalActiveJobs + data.totalFailedJobs)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Of all campaigns</p>
            </CardContent>
          </Card>
        </div>
      </div>

          {/* Candidates Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Candidates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Assessment Stage */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Assessment</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.candidatesInAssessment}</div>
              <p className="text-xs text-muted-foreground">In evaluation process</p>
            </CardContent>
          </Card>

          {/* Demo Stage - Only show if data exists */}
          {data.candidatesInDemo > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Demo</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.candidatesInDemo}</div>
                <p className="text-xs text-muted-foreground">Technical demonstration</p>
              </CardContent>
            </Card>
          )}

          {/* Interview Stage */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Interview</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.candidatesInInterview}</div>
              <p className="text-xs text-muted-foreground">Interview process</p>
            </CardContent>
          </Card>

          {/* Offered */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Offered</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.candidatesOffered}</div>
              <p className="text-xs text-muted-foreground">Offers extended</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Average Time to Hire and Offer Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Time to Hire */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageTimeToHire}</div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>

        {/* Offered Accepted */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers Accepted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.offeredAccepted}</div>
            <p className="text-xs text-muted-foreground">Offers accepted by candidates</p>
          </CardContent>
        </Card>

        {/* Offered Rejected */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers Rejected</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.offeredRejected}</div>
            <p className="text-xs text-muted-foreground">Offers declined by candidates</p>
          </CardContent>
        </Card>
      </div>

      {/* Offer Ratio Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Offer Ratios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Offer Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.offeredAccepted > 0 
                  ? Math.round((data.offeredAccepted / (data.offeredAccepted + data.offeredRejected)) * 100) 
                  : 0}%
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Accepted:</span>
                  <span>{data.offeredAccepted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rejected:</span>
                  <span>{data.offeredRejected}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Offer Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.candidatesOffered > 0 
                  ? Math.round((data.offeredAccepted / data.candidatesOffered) * 100) 
                  : 0}%
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Offered:</span>
                  <span>{data.candidatesOffered}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Accepted:</span>
                  <span>{data.offeredAccepted}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SchoolKPIOverview;