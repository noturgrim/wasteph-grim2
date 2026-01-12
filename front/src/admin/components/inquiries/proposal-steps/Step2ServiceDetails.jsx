export function Step2ServiceDetails({
  selectedServiceType,
  selectedTemplate,
  templateFields,
  onTemplateFieldsChange
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Service Details</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This section will be implemented in a future update.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🚧 Service-specific details coming soon. Default values will be used in the proposal template.
          </p>
        </div>
      </div>
    </div>
  );
}
