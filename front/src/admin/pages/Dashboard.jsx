import { useState, useEffect, useRef } from "react";
import { Users, FileText, FolderKanban, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import DashboardCard from "../components/common/DashboardCard";
import PipelineBreakdown from "../components/dashboard/PipelineBreakdown";
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

export default function Dashboard() {
  const { user } = useAuth();
  const fetchIdRef = useRef(0);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const currentFetchId = ++fetchIdRef.current;
      setIsLoading(true);

      try {
        const response = await api.getSalesDashboard();
        if (currentFetchId !== fetchIdRef.current) return;
        setData(response.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        if (currentFetchId === fetchIdRef.current) setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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

      {/* Pipeline + Events */}
      {isLoading ? (
        <ContentSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <PipelineBreakdown
            proposals={data?.pipeline?.proposals ?? []}
            contracts={data?.pipeline?.contracts ?? []}
          />
          <UpcomingEvents events={data?.upcomingEvents ?? []} />
        </div>
      )}

      {/* Recent Activity */}
      {isLoading ? (
        <Skeleton className="h-[280px] rounded-xl" />
      ) : (
        <RecentActivity activities={data?.recentActivity ?? []} />
      )}
    </div>
  );
}
