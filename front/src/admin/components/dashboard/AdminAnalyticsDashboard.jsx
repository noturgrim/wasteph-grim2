import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../services/api";
import socketService from "../../services/socketService";
import ConversionFunnelSection from "./ConversionFunnelSection";
import BusinessGrowthSection from "./BusinessGrowthSection";
import TicketAnalyticsSection from "./TicketAnalyticsSection";

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-[400px] rounded-lg" />
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Skeleton className="h-[500px] rounded-lg" />
      <Skeleton className="h-[500px] rounded-lg" />
    </div>
    <Skeleton className="h-[600px] rounded-lg" />
  </div>
);

// Socket events that trigger analytics refresh
const REFRESH_EVENTS = [
  "ticket:created",
  "ticket:updated",
  "ticket:statusChanged",
  "proposal:sent",
  "proposal:accepted",
  "contract:signed",
  "lead:created",
  "lead:claimed",
];

export default function AdminAnalyticsDashboard() {
  const fetchIdRef = useRef(0);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (showLoader = true) => {
    const currentFetchId = ++fetchIdRef.current;
    if (showLoader) setIsLoading(true);

    try {
      const response = await api.getAdminAnalyticsDashboard();
      if (currentFetchId !== fetchIdRef.current) return;
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
      if (currentFetchId === fetchIdRef.current) {
        setError(err.message || "Failed to load analytics data");
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData(true);
  }, []);

  // Real-time refresh via socket
  useEffect(() => {
    const handleRefresh = () => fetchData(false);

    for (const event of REFRESH_EVENTS) {
      socketService.on(event, handleRefresh);
    }

    return () => {
      for (const event of REFRESH_EVENTS) {
        socketService.off(event, handleRefresh);
      }
    };
  }, []);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="conversion" className="space-y-6">
      <TabsList>
        <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
        <TabsTrigger value="business">Business Growth</TabsTrigger>
        <TabsTrigger value="tickets">Ticket Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="conversion" className="space-y-4">
        <ConversionFunnelSection data={data.conversionFunnel} />
      </TabsContent>

      <TabsContent value="business" className="space-y-4">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <BusinessGrowthSection data={data.businessGrowth} />
        </div>
      </TabsContent>

      <TabsContent value="tickets" className="space-y-4">
        <TicketAnalyticsSection data={data.ticketAnalytics} />
      </TabsContent>
    </Tabs>
  );
}
