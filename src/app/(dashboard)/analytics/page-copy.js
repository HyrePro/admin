import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SchoolAnalyticsDashboard() {
  const [duration, setDuration] = useState('month');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Replace with: 
      // const response = await fetch(`/api/analytics?school_id=${schoolId}&duration=${duration}`);
      // const data = await response.json();
      
      setAnalytics({
        total_active_campaigns: 12,
        total_successful_campaigns: 8,
        total_failed_campaigns: 3,
        candidates_assessment_stage: 45,
        candidates_interview_stage: 23,
        candidates_offered: 15,
        avg_time_to_hire_days: 18.5,
        offers_extended: 15,
        offers_accepted: 12,
        offers_declined: 3,
        offer_acceptance_rate: 80.0,
        offer_decline_rate: 20.0
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [duration]);

  const MetricCard = ({ title, value, subtitle, change, changeType }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {change && (
              <p className={`text-xs mt-2 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // Prepare chart data
  const campaignData = analytics ? [
    { name: 'Active', value: analytics.total_active_campaigns, fill: '#3b82f6' },
    { name: 'Successful', value: analytics.total_successful_campaigns, fill: '#10b981' },
    { name: 'Failed', value: analytics.total_failed_campaigns, fill: '#ef4444' }
  ] : [];

  const pipelineData = analytics ? [
    { stage: 'Assessment', candidates: analytics.candidates_assessment_stage },
    { stage: 'Interview', candidates: analytics.candidates_interview_stage },
    { stage: 'Offered', candidates: analytics.candidates_offered }
  ] : [];

  const offerData = analytics ? [
    { name: 'Accepted', value: analytics.offers_accepted, fill: '#10b981' },
    { name: 'Declined', value: analytics.offers_declined, fill: '#ef4444' }
  ] : [];

  const conversionData = analytics ? [
    { 
      stage: 'Assessment', 
      count: analytics.candidates_assessment_stage,
      rate: 100 
    },
    { 
      stage: 'Interview', 
      count: analytics.candidates_interview_stage,
      rate: analytics.candidates_assessment_stage > 0 
        ? ((analytics.candidates_interview_stage / analytics.candidates_assessment_stage) * 100).toFixed(1)
        : 0
    },
    { 
      stage: 'Offered', 
      count: analytics.candidates_offered,
      rate: analytics.candidates_interview_stage > 0 
        ? ((analytics.candidates_offered / analytics.candidates_interview_stage) * 100).toFixed(1)
        : 0
    }
  ] : [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} {payload[0].name === 'rate' ? '%' : 'candidates'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recruitment Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive overview of hiring performance and candidate pipeline
            </p>
          </div>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Campaigns"
            value={analytics?.total_active_campaigns || 0}
            subtitle="Open positions"
          />
          <MetricCard
            title="Successful Hires"
            value={analytics?.total_successful_campaigns || 0}
            subtitle="Positions filled"
          />
          <MetricCard
            title="Time to Hire"
            value={`${analytics?.avg_time_to_hire_days?.toFixed(1) || 0} days`}
            subtitle="Average duration"
          />
          <MetricCard
            title="Offer Acceptance"
            value={`${analytics?.offer_acceptance_rate?.toFixed(0) || 0}%`}
            subtitle={`${analytics?.offers_accepted || 0} of ${analytics?.offers_extended || 0} offers`}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Status */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
              <CardDescription>Distribution of job campaigns by status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={campaignData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {campaignData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Candidate Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Pipeline</CardTitle>
              <CardDescription>Number of candidates at each stage</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="stage" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="candidates" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offer Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Offer Outcomes</CardTitle>
              <CardDescription>Acceptance vs decline ratio</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={offerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {offerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                    <div>
                      <div className="text-2xl font-bold">{analytics?.offers_extended || 0}</div>
                      <div className="text-xs text-muted-foreground">Extended</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{analytics?.offers_accepted || 0}</div>
                      <div className="text-xs text-muted-foreground">Accepted</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{analytics?.offers_declined || 0}</div>
                      <div className="text-xs text-muted-foreground">Declined</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Stage-to-stage conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="stage" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Candidates"
                      dot={{ r: 4 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Conversion %"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key performance indicators for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Candidates</p>
                  <p className="text-2xl font-bold">
                    {(analytics?.candidates_assessment_stage || 0) + 
                     (analytics?.candidates_interview_stage || 0) + 
                     (analytics?.candidates_offered || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {analytics?.total_active_campaigns + analytics?.total_successful_campaigns > 0
                      ? ((analytics?.total_successful_campaigns / (analytics?.total_active_campaigns + analytics?.total_successful_campaigns)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Interview Conversion</p>
                  <p className="text-2xl font-bold">
                    {analytics?.candidates_interview_stage > 0
                      ? ((analytics?.candidates_offered / analytics?.candidates_interview_stage) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Time to Hire</p>
                  <p className="text-2xl font-bold">{analytics?.avg_time_to_hire_days?.toFixed(1) || 0}d</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}