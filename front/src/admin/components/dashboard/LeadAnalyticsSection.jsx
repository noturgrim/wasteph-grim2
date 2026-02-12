import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Users } from "lucide-react";

const chartConfig = {
  claimed: { label: "Claimed", color: "hsl(217, 91%, 60%)" },
  available: { label: "Available", color: "hsl(142, 76%, 36%)" },
};

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)"];

export default function LeadAnalyticsSection({ data }) {
  if (!data) return null;

  const pieData = [
    { name: "Claimed", value: data.claimedLeads || 0 },
    { name: "Available", value: data.unclaimedLeads || 0 },
  ];

  // Top 5 lead generators
  const topGenerators = (data.byUser || []).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Lead Distribution</CardTitle>
            <CardDescription>Claimed vs available leads</CardDescription>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-3xl font-bold">{data.totalLeads || 0}</span>
          <span className="text-sm text-muted-foreground ml-2">total leads</span>
        </div>

        <ChartContainer config={chartConfig} className="h-[200px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                label={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '14px',
                  color: 'hsl(var(--foreground))',
                }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top Lead Generators */}
        {topGenerators.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Top Lead Generators
            </h4>
            {topGenerators.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm border-b border-border py-2 last:border-0"
              >
                <span className="font-medium">{user.userName}</span>
                <span className="text-muted-foreground">{user.claimed} leads</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
