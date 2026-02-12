import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderKanban, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ContractAnalyticsSection({ data }) {
  if (!data) return null;

  const statusEntries = Object.entries(data.byStatus || {}).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
  }));

  const maxCount = Math.max(...statusEntries.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Contract Performance</CardTitle>
            <CardDescription>Status distribution & conversion</CardDescription>
          </div>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold">{data.signedContracts || 0}</span>
          <span className="text-sm text-muted-foreground">signed</span>
          <div className="ml-auto flex items-center gap-1 text-sm text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            <span>{data.conversionRate || 0}% conversion</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Status Breakdown
          </div>
          {statusEntries.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{item.status}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <Progress value={(item.count / maxCount) * 100} className="h-2" />
            </div>
          ))}
        </div>

        {data.totalContracts > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Contracts</span>
              <span className="font-bold">{data.totalContracts}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
