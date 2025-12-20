import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DashboardCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
  color = "emerald",
}) => {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <Card className="border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer touch-manipulation">
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 truncate">
              {value}
            </p>

            {change && (
              <div className="flex items-center gap-1 flex-wrap">
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 shrink-0" />
                )}
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    trend === "up" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {change}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                  vs last month
                </span>
              </div>
            )}
          </div>

          <div
            className={`p-2 sm:p-3 rounded-xl border-2 shrink-0 ${colorClasses[color]}`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
