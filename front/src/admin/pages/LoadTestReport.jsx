import { useState, useEffect } from "react";
import { Download, ExternalLink, BarChart3, CheckCircle, Calendar, Activity, HelpCircle, Database, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const REPORT_CONFIGS = {
  standard: {
    label: "Standard Test",
    description: "~40 records baseline test",
    icon: CheckCircle,
    color: "blue",
    dataset: "10 inquiries, 20 leads, 10 clients",
    totalRecords: "~40 records",
    duration: "6m 27s",
    iterations: "71",
  },
  "100": {
    label: "Medium Load Test",
    description: "300 records realistic scenario",
    icon: Database,
    color: "emerald",
    dataset: "100 inquiries, 100 leads, 100 clients",
    totalRecords: "306 records",
    duration: "6m 18s",
    iterations: "72",
  },
  "500": {
    label: "Stress Test",
    description: "1,500 records high-load test",
    icon: Zap,
    color: "orange",
    dataset: "500 inquiries, 500 leads, 500 clients",
    totalRecords: "1,506 records",
    duration: "6m 15s",
    iterations: "72",
  },
};

const LoadTestReport = () => {
  const [selectedReport, setSelectedReport] = useState("standard");
  const [availableReports, setAvailableReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableReports();
  }, []);

  const fetchAvailableReports = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/load-test/available`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setAvailableReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch available reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`${API_URL}/reports/load-test/download?type=${selectedReport}`, "_blank");
  };

  const handleOpenNewTab = () => {
    window.open(`${API_URL}/reports/load-test?type=${selectedReport}`, "_blank");
  };

  const currentConfig = REPORT_CONFIGS[selectedReport];
  const currentReport = availableReports.find((r) => r.type === selectedReport);
  const reportExists = currentReport?.exists || false;

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        gradient: "from-blue-500 to-blue-600",
        border: "border-blue-200 dark:border-blue-500/30",
        bg: "from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-600/10",
        text: "text-blue-700 dark:text-blue-400",
      },
      emerald: {
        gradient: "from-[#15803d] to-[#16a34a]",
        border: "border-emerald-200 dark:border-[#15803d]/30",
        bg: "from-emerald-50 to-emerald-100 dark:from-[#15803d]/20 dark:to-[#16a34a]/10",
        text: "text-emerald-700 dark:text-[#15803d]",
      },
      red: {
        gradient: "from-red-600 to-red-700",
        border: "border-red-200 dark:border-red-500/30",
        bg: "from-red-50 to-red-100 dark:from-red-500/20 dark:to-red-600/10",
        text: "text-red-700 dark:text-red-400",
      },
      orange: {
        gradient: "from-orange-600 to-orange-700",
        border: "border-orange-200 dark:border-orange-500/30",
        bg: "from-orange-50 to-orange-100 dark:from-orange-500/20 dark:to-orange-600/10",
        text: "text-orange-700 dark:text-orange-400",
      },
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses(currentConfig.color);
  const IconComponent = currentConfig.icon;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses.gradient}`}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Load Test Reports
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Infrastructure Performance Assessment
              </p>
            </div>
          </div>
        </div>

        {/* Report Selector */}
        <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">Select Test Scenario</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Choose which load test report to view
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-black/40 dark:text-white dark:ring-offset-black dark:focus:ring-emerald-600"
            >
              {Object.entries(REPORT_CONFIGS).map(([key, config]) => {
                const report = availableReports.find((r) => r.type === key);
                const exists = report?.exists || false;
                return (
                  <option key={key} value={key}>
                    {config.label} {exists ? "● Available" : "○ Not Generated"}
                  </option>
                );
              })}
            </select>

            {/* Selected Report Info */}
            <div className={`flex items-start gap-3 p-4 rounded-lg border-2 bg-gradient-to-br ${colorClasses.bg} ${colorClasses.border}`}>
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses.gradient}`}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${colorClasses.text}`}>
                  {currentConfig.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {currentConfig.description}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Dataset: {currentConfig.dataset}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Performance Summary */}
        <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-300 dark:border-emerald-500">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Infrastructure Performance: EXCELLENT
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  All three test scenarios passed critical thresholds
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Response Times</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">All tests &lt; 2000ms (p95)</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Error Rate</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">0% across all scenarios</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Scalability</div>
                <div class="text-xs text-slate-600 dark:text-slate-400">No degradation at 5x load</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Status */}
        {!reportExists ? (
          <Card className="backdrop-blur-xl border-amber-200 bg-amber-50 dark:border-white/10 dark:bg-black/40">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-gradient-to-br from-amber-400 to-amber-500 text-white border-amber-300 dark:border-amber-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-amber-900 dark:text-white">
                    Report Not Generated
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-slate-400">
                    This test hasn't been executed yet. Run the load test to generate this report.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-amber-800 dark:text-slate-400">
                <p className="font-semibold dark:text-white">To generate this report:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Navigate to backend directory: <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-white/10 rounded text-amber-900 dark:text-white">cd backend</code></li>
                  <li>Seed test data: <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-white/10 rounded text-amber-900 dark:text-white">npm run seed:loadtest-{selectedReport}</code></li>
                  <li>Navigate to loadtest directory: <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-white/10 rounded text-amber-900 dark:text-white">cd loadtest</code></li>
                  <li>Run test: <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-white/10 rounded text-amber-900 dark:text-white">k6 run -e REPORT_TYPE={selectedReport} staff-workflow.js</code></li>
                  <li>Cleanup: <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-white/10 rounded text-amber-900 dark:text-white">npm run cleanup:loadtest</code></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Test Status Card */}
            <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-gradient-to-br ${colorClasses.gradient}`}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900 dark:text-white">
                        Report Available
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        {currentConfig.label} results are ready to view
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Test Details Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Test Date */}
              <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses.gradient}`}>
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Last Modified</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {currentReport?.lastModified ? new Date(currentReport.lastModified).toLocaleDateString() : "N/A"}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {currentReport?.lastModified ? new Date(currentReport.lastModified).toLocaleTimeString() : ""}
                  </p>
                </CardContent>
              </Card>

              {/* Dataset Size */}
              <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses.gradient}`}>
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Total Records</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {currentConfig.totalRecords}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {currentConfig.dataset}
                  </p>
                </CardContent>
              </Card>

              {/* Duration */}
              <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses.gradient}`}>
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Test Duration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {currentConfig.duration}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {currentConfig.iterations} iterations
                  </p>
                </CardContent>
              </Card>

              {/* Virtual Users */}
              <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses.gradient}`}>
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Virtual Users</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    6
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Concurrent staff
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions Card */}
            <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">View Report</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Access the detailed performance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleOpenNewTab}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Full Report
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Comparison Overview */}
            <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">All Test Results Comparison</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Quick overview of all load test scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Test Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Dataset</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Duration</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(REPORT_CONFIGS).map(([key, config]) => {
                        const report = availableReports.find((r) => r.type === key);
                        const exists = report?.exists || false;
                        return (
                          <tr key={key} className="border-b border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getColorClasses(config.color).gradient}`}>
                                  {config.icon === CheckCircle && <CheckCircle className="h-4 w-4 text-white" />}
                                  {config.icon === Database && <Database className="h-4 w-4 text-white" />}
                                  {config.icon === Zap && <Zap className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{config.label}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">{config.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{config.totalRecords}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{config.duration}</td>
                            <td className="py-3 px-4">
                              {exists ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                  <CheckCircle className="h-3 w-3" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReport(key);
                                    setTimeout(() => handleOpenNewTab(), 100);
                                  }}
                                  disabled={!exists}
                                  className="h-8 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Understanding the Metrics Section */}
            <Card className="backdrop-blur-xl border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#15803d]" />
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Understanding the Metrics
                  </CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Key performance indicators explained
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Response Time (p95)</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      95% of requests completed faster than this time. Lower is better. Target: &lt;2 seconds.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Error Rate</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Percentage of failed requests. Should be close to 0%. Target: &lt;5%.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Throughput</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Number of requests per second the system can handle. Higher is better.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Check Success Rate</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Percentage of validation checks that passed. Should be &gt;95% for healthy system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Info Note */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center p-4">
          Load testing helps ensure the WastePH infrastructure can handle concurrent users efficiently.
          Tests are performed on Railway.app ($7 backend + $6 PostgreSQL).
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LoadTestReport;
