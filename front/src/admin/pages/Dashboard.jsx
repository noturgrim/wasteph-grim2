import { useState, useEffect, useRef, useCallback } from "react";
import { Users, FileText, FolderKanban, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import socketService from "../services/socketService";
import DashboardCard from "../components/common/DashboardCard";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import RecentActivity from "../components/dashboard/RecentActivity";

const STAT_CARDS = [
  {
    key: "activeLeads",
    title: "My Leads",
    icon: Users,
    color: "amber",
  },
  {
    key: "activeProposals",
    title: "Active Proposals",
    icon: FileText,
    color: "blue",
  },
  {
    key: "contractsInProgress",
    title: "Contracts In Progress",
    icon: FolderKanban,
    color: "violet",
  },
  {
    key: "myClients",
    title: "My Clients",
    icon: UserCheck,
    color: "emerald",
  },
];

const StatsSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-[110px] rounded-xl" />
    ))}
  </div>
);

const ContentSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Skeleton className="h-[320px] rounded-xl" />
    <Skeleton className="h-[320px] rounded-xl" />
  </div>
);


// Socket events that should trigger a dashboard refresh
const REFRESH_EVENTS = [
  "ticket:created",
  "ticket:updated",
  "ticket:statusChanged",
  "proposal:requested",
  "proposal:approved",
  "proposal:rejected",
  "proposal:sent",
  "proposal:accepted",
  "proposal:declined",
  "contract:requested",
  "contract:sentToSales",
  "contract:sentToClient",
  "contract:signed",
  "lead:created",
  "lead:updated",
  "lead:claimed",
  "lead:deleted",
];

export default function Dashboard() {
  const { user } = useAuth();
  const fetchIdRef = useRef(0);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async (showLoader = false) => {
    const currentFetchId = ++fetchIdRef.current;
    if (showLoader) setIsLoading(true);

    try {
      const response = await api.getSalesDashboard();
      if (currentFetchId !== fetchIdRef.current) return;
      setData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  // Real-time: silently refresh when any relevant socket event fires
  useEffect(() => {
    const handleRefresh = () => fetchDashboard(false);

    for (const event of REFRESH_EVENTS) {
      socketService.on(event, handleRefresh);
    }

    return () => {
      for (const event of REFRESH_EVENTS) {
        socketService.off(event, handleRefresh);
      }
    };
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}. Here is your pipeline overview.
        </p>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((card) => (
            <DashboardCard
              key={card.key}
              title={card.title}
              value={data?.stats?.[card.key] ?? 0}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </div>
      )}

      {/* Upcoming Events + Recent Activity */}
      {isLoading ? (
        <ContentSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <UpcomingEvents events={data?.upcomingEvents ?? []} />
          <RecentActivity activities={data?.recentActivity ?? []} />
        </div>
      )}
    </div>
  );
}
