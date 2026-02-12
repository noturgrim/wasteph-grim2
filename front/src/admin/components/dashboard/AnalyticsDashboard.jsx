import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../services/api";
import ProposalAnalyticsSection from "./ProposalAnalyticsSection";
import LeadAnalyticsSection from "./LeadAnalyticsSection";
import TeamPerformanceSection from "./TeamPerformanceSection";
import TrendChartsSection from "./TrendChartsSection";

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Skeleton className="h-[400px] rounded-lg" />
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Skeleton className="h-[400px] rounded-lg" />
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
    <Skeleton className="h-[400px] rounded-lg" />
  </div>
);

export default function AnalyticsDashboard() {
  const fetchIdRef = useRef(0);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const currentFetchId = ++fetchIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getAnalyticsDashboard();
        if (currentFetchId !== fetchIdRef.current) return;
        setData(response.data);
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err.message || "Failed to load analytics");
        console.error("Failed to load analytics:", err);
      } finally {
        if (currentFetchId === fetchIdRef.current) setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Proposal Analytics */}
      <ProposalAnalyticsSection data={data.proposalAnalytics} />

      {/* Lead Analytics & Team Performance */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <LeadAnalyticsSection data={data.leadAnalytics} />
        <TeamPerformanceSection data={data.salesTeamPerformance} />
      </div>

      {/* Time Series Trends */}
      <TrendChartsSection data={data.timeSeriesData} />
    </div>
  );
}
