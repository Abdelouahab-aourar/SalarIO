"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type OverviewChartsData = {
  departments: Array<{ department: string; employees: number }>;
  absencesByType: Array<{ type: string; label: string; days: number }>;
  absenceTrend: Array<{ month: string; days: number }>;
};

const departmentConfig = {
  employees: { label: "Employees", color: "#398675" },
} satisfies ChartConfig;

const absenceConfig = {
  days: { label: "Days", color: "#398675" },
} satisfies ChartConfig;

const trendConfig = {
  days: { label: "Absence days", color: "#24564B" },
} satisfies ChartConfig;

const ABSENCE_COLORS = ["#173B35", "#398675", "#A8C9B5", "#D5B77A"];

/**
 * Overview charts (shadcn/ui + Recharts) with mount animations:
 * radar headcount per department, absence days by type and a 6-month trend.
 */
export function OverviewCharts({ data }: { data: OverviewChartsData }) {
  const departmentData = [...data.departments].sort((a, b) => b.employees - a.employees).slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      {/* Radar with dots — headcount per department */}
      <Card>
        <CardHeader>
          <h2 className="text-[15px] font-bold text-[#102E29]">Employees per department</h2>
          <p className="text-[11px] text-[#62776E]">Headcount across departments</p>
        </CardHeader>
        <CardContent>
          {departmentData.length === 0 ? (
            <p className="py-16 text-center text-[12px] text-[#62776E]">No department data yet.</p>
          ) : (
            <ChartContainer config={departmentConfig} className="mx-auto aspect-square max-h-[280px] w-full">
              <RadarChart data={departmentData} outerRadius="72%">
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid stroke="#DCE6DF" />
                <PolarAngleAxis dataKey="department" tick={{ fill: "#596760", fontSize: 10 }} />
                <Radar
                  name="Employees"
                  dataKey="employees"
                  stroke="var(--color-employees)"
                  fill="var(--color-employees)"
                  fillOpacity={0.35}
                  dot={{ r: 4, fillOpacity: 1, fill: "var(--color-employees)" }}
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                />
              </RadarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Absence days by type */}
      <Card>
        <CardHeader>
          <h2 className="text-[15px] font-bold text-[#102E29]">Absence days by type</h2>
          <p className="text-[11px] text-[#62776E]">All recorded periods</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={absenceConfig} className="aspect-[4/3] max-h-[280px] w-full">
            <BarChart data={data.absencesByType} margin={{ top: 8, left: -18, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#EDF2EE" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#596760" }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#596760" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="days" radius={[6, 6, 0, 0]} animationDuration={900}>
                {data.absencesByType.map((entry, index) => (
                  <Cell key={entry.type} fill={ABSENCE_COLORS[index % ABSENCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 6-month absence trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <h2 className="text-[15px] font-bold text-[#102E29]">Absence trend</h2>
          <p className="text-[11px] text-[#62776E]">Recorded absence days over the last 6 months</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="h-[220px] w-full">
            <AreaChart data={data.absenceTrend} margin={{ top: 8, left: -18, right: 12 }}>
              <defs>
                <linearGradient id="absenceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-days)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-days)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EDF2EE" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#596760" }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#596760" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="days"
                stroke="var(--color-days)"
                strokeWidth={2.5}
                fill="url(#absenceFill)"
                animationDuration={1100}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
