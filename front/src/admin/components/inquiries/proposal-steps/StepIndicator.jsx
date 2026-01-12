import { Home, User, FileText, DollarSign, FileCheck } from "lucide-react";

const STEPS = [
  { id: 1, title: "Service Type", description: "Select service", icon: Home },
  { id: 2, title: "Client Info", description: "Recipient details", icon: User },
  { id: 3, title: "Service Details", description: "Optional info", icon: FileText },
  { id: 4, title: "Pricing", description: "Optional rates", icon: DollarSign },
  { id: 5, title: "Terms", description: "Payment & notes", icon: FileCheck },
];

export function StepIndicator({ currentStep, onStepClick }) {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 shrink-0">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle and Info */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={`
                    flex items-center justify-center w-9 h-9 rounded-full transition-all shrink-0
                    ${isActive ? 'bg-green-600 text-white' : ''}
                    ${isCompleted ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : ''}
                    disabled:cursor-not-allowed
                  `}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>

                <div className="flex flex-col min-w-0">
                  <p className={`text-xs font-semibold truncate ${
                    isActive ? 'text-green-600 dark:text-green-400' :
                    isCompleted ? 'text-green-600 dark:text-green-500' :
                    'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Chevron Arrow */}
              {index < STEPS.length - 1 && (
                <svg
                  className={`w-3 h-3 mx-2 shrink-0 transition-all ${
                    isCompleted ? 'text-green-600' : 'text-slate-300 dark:text-slate-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
