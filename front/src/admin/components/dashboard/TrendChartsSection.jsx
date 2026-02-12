import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  created: { label: "Created", color: "hsl(142, 76%, 36%)" },
  accepted: { label: "Accepted", color: "hsl(160, 84%, 39%)" },
  signed: { label: "Signed", color: "hsl(134, 61%, 41%)" },
};

export default function TrendChartsSection({ data }) {
  if (!data) return null;

  // Merge proposal and contract trends by month
  const proposalMap = new Map();
  (data.proposalTrend || []).forEach((item) => {
    proposalMap.set(item.month, {
      month: item.month,
      created: item.created,
      accepted: item.accepted,
    });
  });

  const contractMap = new Map();
  (data.contractTrend || []).forEach((item) => {
    contractMap.set(item.month, { signed: item.signed });
  });

  // Combine data
  const combinedData = [];
  const allMonths = new Set([...proposalMap.keys(), ...contractMap.keys()]);

  [...allMonths].sort().forEach((month) => {
    const proposal = proposalMap.get(month) || { month, created: 0, accepted: 0 };
    const contract = contractMap.get(month) || { signed: 0 };

    combinedData.push({
      month,
      created: proposal.created,
      accepted: proposal.accepted,
      signed: contract.signed,
    });
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Activity Trends</CardTitle>
            <CardDescription>Proposals & contracts over last 6 months</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData}>
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
                dataKey="accepted"
                stackId="2"
                stroke="var(--color-accepted)"
                fill="var(--color-accepted)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="signed"
                stackId="3"
                stroke="var(--color-signed)"
                fill="var(--color-signed)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
