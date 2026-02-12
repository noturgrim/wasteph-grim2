import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pie, PieChart, Cell, Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ClipboardList, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const statusChartConfig = {
  open: { label: "Open", color: "hsl(45, 93%, 47%)" },
  in_progress: { label: "In Progress", color: "hsl(217, 91%, 60%)" },
  resolved: { label: "Resolved", color: "hsl(142, 76%, 36%)" },
  closed: { label: "Closed", color: "hsl(215, 28%, 17%)" },
};

const priorityChartConfig = {
  low: { label: "Low", color: "hsl(142, 76%, 36%)" },
  medium: { label: "Medium", color: "hsl(217, 91%, 60%)" },
  high: { label: "High", color: "hsl(45, 93%, 47%)" },
  urgent: { label: "Urgent", color: "hsl(0, 72%, 51%)" },
};

const trendChartConfig = {
  created: { label: "Created", color: "hsl(217, 91%, 60%)" },
  resolved: { label: "Resolved", color: "hsl(142, 76%, 36%)" },
};

const categoryChartConfig = {
  count: { label: "Tickets", color: "hsl(142, 76%, 36%)" },
};

export default function TicketAnalyticsSection({ data }) {
  if (!data) return null;

  const {
    byStatus,
    byPriority,
    avgResolutionHours,
    recentlyResolved,
    agingTickets,
    monthlyTrend,
    topCategories,
    assignedVsUnassigned,
  } = data;

  // Transform status/priority data for pie charts
  const statusData = byStatus.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item.count,
    fill: statusChartConfig[item.status]?.color || "hsl(var(--muted))",
  }));

  const priorityData = byPriority.map((item) => ({
    name: item.priority,
    value: item.count,
    fill: priorityChartConfig[item.priority]?.color || "hsl(var(--muted))",
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Ticket System Analytics</CardTitle>
            <CardDescription>Support volume and resolution metrics</CardDescription>
          </div>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
            </div>
            <p className="text-2xl font-bold">{avgResolutionHours}h</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-muted-foreground">Resolved (7 days)</p>
            </div>
            <p className="text-2xl font-bold">{recentlyResolved}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-muted-foreground">Aging (&gt; 48h)</p>
            </div>
            <p className="text-2xl font-bold">{agingTickets}</p>
          </div>
        </div>

        {/* Status & Priority Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Status Distribution
            </h4>
            <ChartContainer config={statusChartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    label={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px",
                    }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Priority Distribution */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Priority Distribution
            </h4>
            <ChartContainer config={priorityChartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    label={false}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px",
                    }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        {monthlyTrend.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              6-Month Trend (Created vs Resolved)
            </h4>
            <ChartContainer config={trendChartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="var(--color-created)"
                    fill="var(--color-created)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="var(--color-resolved)"
                    fill="var(--color-resolved)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Bottom Row: Top Categories & Assignment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Top Categories
              </h4>
              <ChartContainer config={categoryChartConfig} className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategories} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      tickFormatter={(value) => {
                        // Format category names: technical_issue -> Technical Issue
                        return value.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {/* Assignment Stats */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Assignment Status
            </h4>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900">
                <span className="font-medium text-sm">Assigned</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {assignedVsUnassigned.assigned}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                <span className="font-medium text-sm">Unassigned</span>
                <span className="text-2xl font-bold text-amber-600">
                  {assignedVsUnassigned.unassigned}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
