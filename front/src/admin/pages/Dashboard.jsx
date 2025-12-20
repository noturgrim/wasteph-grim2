import DashboardCard from "../components/common/DashboardCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Users,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

const Dashboard = () => {
  // Mock data - replace with actual API calls
  const stats = [
    {
      title: "Total Inquiries",
      value: "48",
      change: "+12%",
      trend: "up",
      icon: UserPlus,
      color: "emerald",
    },
    {
      title: "Active Leads",
      value: "23",
      change: "+8%",
      trend: "up",
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Potentials",
      value: "15",
      change: "+5%",
      trend: "up",
      icon: FileText,
      color: "amber",
    },
    {
      title: "Contracted Clients",
      value: "32",
      change: "+15%",
      trend: "up",
      icon: Users,
      color: "violet",
    },
  ];

  const recentInquiries = [
    {
      id: 1,
      company: "ABC Corporation",
      contact: "John Doe",
      service: "Garbage Collection",
      source: "Facebook",
      status: "new",
      date: "2024-12-20",
    },
    {
      id: 2,
      company: "XYZ Industries",
      contact: "Jane Smith",
      service: "Septic Siphoning",
      source: "Email",
      status: "contacted",
      date: "2024-12-19",
    },
    {
      id: 3,
      company: "Tech Solutions Inc",
      contact: "Mike Johnson",
      service: "Hazardous Waste",
      source: "Phone",
      status: "qualified",
      date: "2024-12-18",
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      new: {
        label: "New",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      },
      contacted: {
        label: "Contacted",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
      },
      qualified: {
        label: "Qualified",
        className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      },
    };
    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <DashboardCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Inquiries */}
        <Card className="border-slate-200">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              Recent Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                        {inquiry.company}
                      </h4>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">
                      {inquiry.contact}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-slate-100 truncate max-w-full">
                        {inquiry.service}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">{inquiry.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              <button className="w-full p-3 sm:p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 transition-colors text-left touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                      Add New Inquiry
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      Manually add a new inquiry
                    </p>
                  </div>
                </div>
              </button>

              <button className="w-full p-3 sm:p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors text-left touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                      Add Lead
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      Create a new potential lead
                    </p>
                  </div>
                </div>
              </button>

              <button className="w-full p-3 sm:p-4 rounded-lg border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 active:bg-violet-200 transition-colors text-left touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                      View All Clients
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      See contracted clients
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
