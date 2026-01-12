import { Sparkles } from "lucide-react";

const SERVICE_TYPES = [
  {
    value: "waste_collection",
    label: "Waste Collection (Compactor Hauling)",
    icon: "🚛",
    available: false
  },
  {
    value: "hazardous",
    label: "Hazardous Waste Collection",
    icon: "☢️",
    available: false
  },
  {
    value: "fixed_monthly",
    label: "Fixed Monthly Rate",
    icon: "📅",
    available: true // Only this one has a template implemented
  },
  {
    value: "clearing",
    label: "Clearing Project",
    icon: "🏗️",
    available: false
  },
  {
    value: "one_time",
    label: "One Time Hauling",
    icon: "🚚",
    available: false
  },
  {
    value: "long_term",
    label: "Long Term Garbage (Per-kg)",
    icon: "⚖️",
    available: false
  },
  {
    value: "recyclables",
    label: "Purchase of Recyclables",
    icon: "♻️",
    available: false
  },
];

export function Step1ServiceType({
  selectedServiceType,
  onServiceTypeChange,
  selectedTemplate
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold mb-1">Select Service Type</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Choose the type of service for this proposal. This will determine the template and required information.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SERVICE_TYPES.map((serviceType) => (
          <button
            key={serviceType.value}
            type="button"
            onClick={() => serviceType.available && onServiceTypeChange(serviceType.value)}
            disabled={!serviceType.available}
            className={`
              p-3 rounded-lg border-2 transition-all text-left relative
              ${!serviceType.available
                ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                : selectedServiceType === serviceType.value
                  ? 'border-green-600 bg-green-50 dark:bg-green-950'
                  : 'border-slate-200 dark:border-slate-700 hover:border-green-300'
              }
            `}
          >
            <div className="text-2xl mb-1">{serviceType.icon}</div>
            <div className="font-semibold text-sm">{serviceType.label}</div>
            {!serviceType.available && (
              <div className="absolute top-2 right-2">
                <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                  Coming Soon
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Template auto-selected:</span>
            <span>{selectedTemplate.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
