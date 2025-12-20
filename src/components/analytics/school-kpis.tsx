"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getSchoolKPIs } from "@/lib/supabase/api/kpiService";
import type { SchoolKPIs as SchoolKPIsType } from "@/lib/supabase/api/kpiService";

interface SchoolKPIsProps {
  schoolId: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function SchoolKPIs({ schoolId }: SchoolKPIsProps) {
  const [kpis, setKpis] = useState<SchoolKPIsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const data = await getSchoolKPIs(schoolId, period);
        setKpis(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching KPIs:", err);
        setError("Failed to load KPIs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchKPIs();
    }
  }, [schoolId, period]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading KPIs...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  if (!kpis) {
    return <div className="flex justify-center items-center h-64">No data available</div>;
  }

  // Prepare data for charts
  const campaignData = [
    { name: "Active", value: kpis.total_active_campaigns ?? 0 },
    { name: "Successful", value: kpis.total_successful_campaigns ?? 0 },
    { name: "Failed", value: kpis.total_failed_campaigns ?? 0 },
  ];

  const pipelineData = [
    { name: "Assessment", value: kpis.candidates_assessment_stage ?? 0 },
    { name: "Interview", value: kpis.candidates_interview_stage ?? 0 },
    { name: "Offered", value: kpis.candidates_offered ?? 0 },
  ];

  const sectionPerformanceData = [
    { name: "Pedagogy", value: kpis.section_wise_performance?.pedagogy ?? 0 },
    { name: "Communication", value: kpis.section_wise_performance?.communication ?? 0 },
    { name: "Digital Literacy", value: kpis.section_wise_performance?.digital_literacy ?? 0 },
    { name: "Subject Knowledge", value: kpis.section_wise_performance?.subject_knowledge ?? 0 },
  ];

  const genderData = [
    { name: "Male", value: kpis.male_candidates ?? 0 },
    { name: "Female", value: kpis.female_candidates ?? 0 },
    { name: "Other", value: kpis.other_gender_candidates ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">School Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span>Filter by period:</span>
          <Select value={period} onValueChange={setPeriod}>
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
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{kpis.total_active_campaigns ?? 0}</CardTitle>
            <CardDescription>Active Campaigns</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{kpis.total_successful_campaigns ?? 0}</CardTitle>
            <CardDescription>Successful Campaigns</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{kpis.total_failed_campaigns ?? 0}</CardTitle>
            <CardDescription>Failed Campaigns</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{kpis.avg_time_to_hire ?? 0} days</CardTitle>
            <CardDescription>Avg. Time to Hire</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Status</CardTitle>
            <CardDescription>Distribution of job campaigns by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campaignData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {campaignData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Campaigns"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Candidate Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Pipeline</CardTitle>
            <CardDescription>Number of candidates at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={pipelineData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Section-wise Performance</CardTitle>
            <CardDescription>Average performance across different sections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sectionPerformanceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} />
                <Tooltip formatter={(value) => [(parseFloat(value as string) * 100).toFixed(2) + "%", "Score"]} />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Performance Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Distribution of candidates by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Offer Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{(kpis.offer_extended_vs_accepted ?? 0).toFixed(2)}%</CardTitle>
            <CardDescription>Offer Acceptance Rate</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{(kpis.offer_extended_vs_declined ?? 0).toFixed(2)}%</CardTitle>
            <CardDescription>Offer Decline Rate</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}