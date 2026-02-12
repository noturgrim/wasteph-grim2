import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FileText, TrendingUp } from "lucide-react";

const chartConfig = {
  count: { label: "Proposals", color: "hsl(142, 76%, 36%)" },
  created: { label: "Created", color: "hsl(142, 76%, 36%)" },
  accepted: { label: "Accepted", color: "hsl(160, 84%, 39%)" },
  rejected: { label: "Rejected", color: "hsl(0, 72%, 51%)" },
};

export default function ProposalAnalyticsSection({ data }) {
  if (!data) return null;

  // Transform status breakdown for chart
  const statusData = Object.entries(data.byStatus || {}).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
  }));

  // Format monthly trend data
  const trendData = (data.monthlyTrend || []).map((item) => ({
    month: item.month,
    created: item.created,
    accepted: item.accepted,
    rejected: item.rejected,
  }));

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Proposal Status Breakdown</CardTitle>
              <CardDescription>Distribution by current status</CardDescription>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{data.totalSent || 0}</span>
            <span className="text-sm text-muted-foreground">total sent</span>
            <div className="ml-auto flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{data.approvalRate || 0}% accepted</span>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="status"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className="capitalize"
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proposal Trends</CardTitle>
          <CardDescription>Last 6 months activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="var(--color-created)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="accepted"
                  stroke="var(--color-accepted)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="var(--color-rejected)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
