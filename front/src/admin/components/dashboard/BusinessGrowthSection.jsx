import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Users, FolderKanban, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const contractChartConfig = {
  signed: { label: "Signed Contracts", color: "hsl(142, 76%, 36%)" },
};

const typeChartConfig = {
  count: { label: "Count", color: "hsl(142, 76%, 36%)" },
};

export default function BusinessGrowthSection({ data }) {
  if (!data) return null;

  const { clients, contracts } = data;

  // Calculate active percentage
  const activePercentage = clients.total > 0 ? (clients.active / clients.total) * 100 : 0;

  return (
    <>
      {/* Client Metrics Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Client Growth</CardTitle>
              <CardDescription>Client acquisition and status</CardDescription>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Total Clients */}
          <div className="mb-4">
            <span className="text-3xl font-bold">{clients.total}</span>
            <span className="text-sm text-muted-foreground ml-2">total clients</span>
          </div>

          {/* Active/Inactive Breakdown */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium">{clients.active}</span>
              </div>
              <Progress value={activePercentage} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Inactive</span>
              <span className="font-medium">{clients.inactive}</span>
            </div>
            {clients.suspended > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Suspended</span>
                <span className="font-medium text-amber-600">{clients.suspended}</span>
              </div>
            )}
          </div>

          {/* Growth Rate */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Clients This Month</p>
                <p className="text-2xl font-bold">{clients.newThisMonth}</p>
              </div>
              <div className="text-right">
                {clients.growthRate >= 0 ? (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">{clients.growthRate}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-semibold">{Math.abs(clients.growthRate)}%</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Metrics Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Contract Performance</CardTitle>
              <CardDescription>Signed contracts and trends</CardDescription>
            </div>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Total Signed Contracts */}
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{contracts.totalSigned}</span>
            <span className="text-sm text-muted-foreground">signed contracts</span>
          </div>

          {/* Contracts Ending Soon Warning */}
          {contracts.endingSoon > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <p className="font-medium text-sm">{contracts.endingSoon} Ending Soon</p>
                  <p className="text-xs">Contracts expiring in next 30 days</p>
                </div>
              </div>
            </div>
          )}

          {/* Contract Type Distribution */}
          {contracts.byType.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Contract Types
              </h4>
              <ChartContainer config={typeChartConfig} className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contracts.byType}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="type"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.replace(/_/g, " ").substring(0, 10)}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {/* Monthly Trend */}
          {contracts.monthlyTrend.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                6-Month Trend
              </h4>
              <ChartContainer config={contractChartConfig} className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={contracts.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="signed"
                      stroke="var(--color-signed)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
