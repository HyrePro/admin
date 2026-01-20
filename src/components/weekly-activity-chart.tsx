"use client"

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuthStore } from '@/store/auth-store';
import { useWeeklyActivity } from '@/hooks/useWeeklyActivity';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Calendar } from 'lucide-react';
import {
    ChartConfig,
    ChartContainer,
} from "@/components/ui/chart";

interface WeeklyActivityChartProps {
    schoolId?: string;
}

export interface AnalyticsData {
    period: string;
    total_applications: number;
}

const WeeklyActivity: React.FC<WeeklyActivityChartProps> = ({ schoolId: propSchoolId }) => {
    const { schoolId: storeSchoolId } = useAuthStore();
    const effectiveSchoolId = propSchoolId || storeSchoolId;

    const {
        data = [],
        isLoading: loading,
        error: queryError
    } = useWeeklyActivity(effectiveSchoolId || '');
    
    const error = queryError ? (queryError instanceof Error ? queryError.message : 'An unknown error occurred') : null;

    const maxApplications = React.useMemo(() => {
        if (data.length === 0) return 10;
        const max = Math.max(...data.map(d => d.total_applications));
        return Math.ceil(max / 5) * 5;
    }, [data]);

    const chartConfig = {
        total_applications: {
            label: "Applications",
            color: "#3b82f6",
        },
    } satisfies ChartConfig;

    if (loading) {
        return (
            <Card className="h-full border-gray-200 shadow-sm">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600">Loading activity data...</p>
                    </div>
                </div>
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">{payload[0].payload.period}</p>
                    <p className="text-sm font-bold text-blue-600">
                        {payload[0].value} Applications
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200 h-full overflow-hidden py-0 pt-4" >
            {/* Header */}
            <CardHeader className="border-b border-gray-200 pb-2">
                        <CardTitle className="text-md font-bold text-gray-900">
                            Weekly Activity
                        </CardTitle>
                        <p className="text-sm text-gray-600">Application trends over time</p>
            </CardHeader>

            <CardContent className="p-6">
                <ChartContainer
                    config={chartConfig}
                    className="w-full h-[280px]"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                            data={data} 
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke="#e5e7eb" 
                                vertical={false}
                            />
                            <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                domain={[0, maxApplications]}
                                ticks={Array.from({ length: (maxApplications / 5) + 1 }, (_, i) => i * 5)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="total_applications"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="url(#colorApplications)"
                                dot={{ 
                                    fill: '#3b82f6', 
                                    strokeWidth: 2, 
                                    stroke: '#fff',
                                    r: 5 
                                }}
                                activeDot={{ 
                                    r: 7,
                                    fill: '#3b82f6',
                                    stroke: '#fff',
                                    strokeWidth: 2
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>

            {/* Footer Legend */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-700 font-medium">Applications Received</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default WeeklyActivity;