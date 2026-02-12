import { Card } from "@/components/ui/card";

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => {
  return (
    <Card className="border border-border bg-card">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </h3>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DashboardCard;
