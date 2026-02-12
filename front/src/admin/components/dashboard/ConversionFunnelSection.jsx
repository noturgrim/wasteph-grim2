import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, ArrowRight } from "lucide-react";

const chartConfig = {
  count: { label: "Count", color: "hsl(142, 76%, 36%)" },
};

export default function ConversionFunnelSection({ data }) {
  if (!data) return null;

  const { stages, overallConversion, inquirySources } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>Pipeline efficiency from inquiries to contracts</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Conversion KPI */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Conversion Rate</p>
              <p className="text-3xl font-bold text-emerald-600">{overallConversion}%</p>
              <p className="text-xs text-muted-foreground mt-1">Inquiry → Contract</p>
            </div>
          </div>
        </div>

        {/* Funnel Stages */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-medium text-muted-foreground">Funnel Breakdown</h4>
          {stages.map((stage, index) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stage.stage}</span>
                  {stage.conversionToNext !== null && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-emerald-600 font-medium">
                        {stage.conversionToNext.toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
                <span className="text-2xl font-bold">{stage.count}</span>
              </div>
              {index < stages.length - 1 && <div className="h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Inquiry Sources */}
        {inquirySources.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Inquiry Sources
            </h4>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inquirySources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="source"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
