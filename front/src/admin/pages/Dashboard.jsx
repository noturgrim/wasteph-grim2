import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Users,
  FileText,
  FolderKanban,
  UserCheck,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import socketService from "../services/socketService";
import DashboardCard from "../components/common/DashboardCard";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import RecentActivity from "../components/dashboard/RecentActivity";
import PendingActions from "../components/dashboard/PendingActions";
import AnalyticsDashboard from "../components/dashboard/AnalyticsDashboard";
import AdminAnalyticsDashboard from "../components/dashboard/AdminAnalyticsDashboard";

// --- Stat card definitions ---

const SALES_STAT_CARDS = [
  { key: "activeLeads", title: "My Leads", icon: Users },
  { key: "activeProposals", title: "Active Proposals", icon: FileText },
  { key: "contractsInProgress", title: "Contracts In Progress", icon: FolderKanban },
  { key: "myClients", title: "My Clients", icon: UserCheck },
];

const ADMIN_STAT_CARDS = [
  { key: "totalInquiries", title: "Total Inquiries", icon: MessageSquare },
  { key: "totalLeads", title: "Total Leads", icon: Users },
  { key: "activeProposals", title: "Active Proposals", icon: FileText },
  { key: "activeContracts", title: "Active Contracts", icon: FolderKanban },
  { key: "totalClients", title: "Total Clients", icon: UserCheck },
  { key: "openTickets", title: "Open Tickets", icon: ClipboardList },
];

// --- Skeleton loaders ---

const StatsSkeleton = ({ count = 4 }) => (
  <div
    className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 ${count > 4 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
  >
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-[100px] sm:h-[110px] rounded-xl" />
    ))}
  </div>
);

const ContentSkeleton = () => (
  <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
    <Skeleton className="h-[320px] sm:h-[420px] rounded-xl" />
    <Skeleton className="h-[320px] sm:h-[420px] rounded-xl" />
  </div>
);

// --- Socket events that trigger a dashboard refresh ---

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

// --- Main component ---

export default function Dashboard() {
  const { user } = useAuth();
  const fetchIdRef = useRef(0);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = useMemo(
    () => user?.role === "super_admin" || user?.role === "admin",
    [user?.role],
  );

  const fetchDashboard = useCallback(
    async (showLoader = false) => {
      const currentFetchId = ++fetchIdRef.current;
      if (showLoader) setIsLoading(true);

      try {
        const response = isAdmin
          ? await api.getAdminDashboard()
          : await api.getSalesDashboard();
        if (currentFetchId !== fetchIdRef.current) return;
        setData(response.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        if (currentFetchId === fetchIdRef.current) setIsLoading(false);
      }
    },
    [isAdmin],
  );

  // Initial fetch
  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  // Real-time refresh
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

  const statCards = isAdmin ? ADMIN_STAT_CARDS : SALES_STAT_CARDS;
  const gridCols = isAdmin ? "lg:grid-cols-3 xl:grid-cols-6" : "xl:grid-cols-4";
  const isMasterSales = user?.role === "sales" && user?.isMasterSales;

  // Render for admin users (with tabs)
  if (isAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back, {user?.firstName}. Here is your system overview.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stat Cards */}
            {isLoading ? (
              <StatsSkeleton count={statCards.length} />
            ) : (
              <div className={`grid gap-4 grid-cols-2 md:grid-cols-4 ${gridCols}`}>
                {statCards.map((card) => (
                  <DashboardCard
                    key={card.key}
                    title={card.title}
                    value={data?.stats?.[card.key] ?? 0}
                    icon={card.icon}
                  />
                ))}
              </div>
            )}

            {/* Content area */}
            {isLoading ? (
              <ContentSkeleton />
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                <PendingActions data={data?.pendingActions} />
                <RecentActivity
                  activities={data?.recentActivity ?? []}
                  showActor
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Render for sales users (with tabs for master sales)
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Welcome back, {user?.firstName}. Here is your pipeline overview.
        </p>
      </div>

      {isMasterSales ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stat Cards */}
            {isLoading ? (
              <StatsSkeleton count={statCards.length} />
            ) : (
              <div className={`grid gap-4 grid-cols-2 md:grid-cols-4 ${gridCols}`}>
                {statCards.map((card) => (
                  <DashboardCard
                    key={card.key}
                    title={card.title}
                    value={data?.stats?.[card.key] ?? 0}
                    icon={card.icon}
                  />
                ))}
              </div>
            )}

            {/* Content area */}
            {isLoading ? (
              <ContentSkeleton />
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                <UpcomingEvents events={data?.upcomingEvents ?? []} />
                <RecentActivity activities={data?.recentActivity ?? []} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* Stat Cards */}
          {isLoading ? (
            <StatsSkeleton count={statCards.length} />
          ) : (
            <div className={`grid gap-4 grid-cols-2 md:grid-cols-4 ${gridCols}`}>
              {statCards.map((card) => (
                <DashboardCard
                  key={card.key}
                  title={card.title}
                  value={data?.stats?.[card.key] ?? 0}
                  icon={card.icon}
                />
              ))}
            </div>
          )}

          {/* Content area */}
          {isLoading ? (
            <ContentSkeleton />
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
              <UpcomingEvents events={data?.upcomingEvents ?? []} />
              <RecentActivity activities={data?.recentActivity ?? []} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
