import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";

export function NavigationFooter({
  currentStep,
  totalSteps = 5,
  onPrevious,
  onNext,
  onPreview,
  onCancel,
  canProceed = true,
  isLoadingPreview = false,
  isDefaultTemplateLoaded = true,
  hasSelectedService = true
}) {
  return (
    <div className="px-6 py-3 border-t bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
      {/* Previous Button */}
      {currentStep > 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
      )}

      <div className="flex-1" />

      {/* Next/Generate Preview Button */}
      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed || !hasSelectedService}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onPreview}
          disabled={isLoadingPreview || !isDefaultTemplateLoaded || !hasSelectedService}
        >
          <Eye className="h-4 w-4 mr-2" />
          {isLoadingPreview ? "Generating..." : "Generate Preview"}
        </Button>
      )}
    </div>
  );
}
