"use client"

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/api/client';
import { Card, CardHeader, CardTitle } from './ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface WeeklyActivityChartProps {
    schoolId?: string;
}

interface AnalyticsData {
    period: string;
    total_applications: number;
}

const WeeklyActivity: React.FC<WeeklyActivityChartProps> = ({ schoolId: propSchoolId }) => {
    const { schoolId: storeSchoolId } = useAuthStore();
    const effectiveSchoolId = propSchoolId || storeSchoolId;

    const [timeRange, setTimeRange] = React.useState('Weekly');
    const [data, setData] = React.useState<AnalyticsData[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!effectiveSchoolId) return;

            setLoading(true);
            try {
                const supabase = await createClient();
                const { data: responseData, error } = await supabase.rpc('get_application_stats', {
                    p_school_id: effectiveSchoolId,
                    p_type: timeRange.toLowerCase()
                });
                console.log(responseData)
                if (error) {
                    console.error('Error fetching weekly activity data:', error);
                    // Fallback to sample data if RPC fails
                    setData([
                        { period: 'Mon', total_applications: 10 },
                        { period: 'Tue', total_applications: 12 },
                        { period: 'Wed', total_applications: 8 },
                        { period: 'Thu', total_applications: 17 },
                        { period: 'Fri', total_applications: 19 },
                        { period: 'Sat', total_applications: 5 },
                        { period: 'Sun', total_applications: 5 },
                    ]);
                } else {
                    setData(responseData || []);
                }
            } catch (err) {
                console.error('Error in weekly activity data fetching:', err);
                // Fallback to sample data if RPC fails
                setData([
                    { period: 'Mon', total_applications: 10 },
                    { period: 'Tue', total_applications: 12 },
                    { period: 'Wed', total_applications: 8 },
                    { period: 'Thu', total_applications: 17 },
                    { period: 'Fri', total_applications: 19 },
                    { period: 'Sat', total_applications: 5 },
                    { period: 'Sun', total_applications: 5 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [effectiveSchoolId, timeRange]);

    // Calculate the next multiple of 5 for the max value
    const maxApplications = React.useMemo(() => {
        if (data.length === 0) return 10;
        const max = Math.max(...data.map(d => d.total_applications));
        return Math.ceil(max / 5) * 5;
    }, [data]);

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    // Chart configuration
    const chartConfig = {
        total_applications: {
            label: "Applications",
            color: "#3b82f6", // blue-500
        },
    } satisfies ChartConfig;

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300 gap-2 py-4 px-4 flex flex-col border-1 border-gray-200 shadow-none">
            <div className="flex flex-row justify-between items-center pb-4">
                <CardTitle>
                    {timeRange + " Activity"}
                </CardTitle>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ChartContainer
                config={chartConfig}
                className="w-full flex-1"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#c7c7c7" />
                        <XAxis
                            dataKey="period"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            domain={[0, maxApplications]}
                            ticks={Array.from({ length: (maxApplications / 5) + 1 }, (_, i) => i * 5)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total_applications"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Applications"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </Card>
    );
};

export default WeeklyActivity;