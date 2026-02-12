import { Download, ExternalLink, BarChart3, CheckCircle, Calendar, Activity, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoadTestReport = () => {
  const handleDownload = () => {
    window.open(`${API_URL}/reports/load-test/download`, "_blank");
  };

  const handleOpenNewTab = () => {
    window.open(`${API_URL}/reports/load-test`, "_blank");
  };

  // Test information
  const testDate = "February 12, 2026";
  const testTime = "2:30 PM";
  const testDuration = "6 minutes 27 seconds";
  const virtualUsers = "6 concurrent staff";
  const totalRequests = "568 requests";
  const passStatus = "PASSED";

  return (
    <TooltipProvider>
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#15803d] to-[#16a34a]">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Load Test Report
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Infrastructure Performance Assessment
            </p>
          </div>
        </div>
      </div>

      {/* Test Status Card */}
      <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                  {passStatus}
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Infrastructure supports 6 concurrent users with optimal performance
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Test Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Test Date */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Test Date</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {testDate}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {testTime}
            </p>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Activity className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Test Duration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {testDuration}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Continuous load testing
            </p>
          </CardContent>
        </Card>

        {/* Virtual Users */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Activity className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Virtual Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {virtualUsers}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalRequests}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Summary */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Performance Highlights</CardTitle>
          <CardDescription>Key metrics from the load test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Response Time (p95)
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">95% of all requests completed faster than this time. Lower is better.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                578ms
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Threshold: &lt; 2000ms
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Error Rate
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Percentage of failed requests. 0% means no errors occurred.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                0.00%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Threshold: &lt; 5%
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Throughput
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Number of requests handled per second. Higher is better.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                1.46/s
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Requests per second
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Login Speed (p95)
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">How fast users can log in. 95% of logins were faster than this.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                462ms
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Threshold: &lt; 1000ms
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">View Full Report</CardTitle>
          <CardDescription>
            Access the complete detailed performance report with all metrics and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleOpenNewTab}
              className="flex-1 bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#166534] hover:to-[#15803d] text-white shadow-lg"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Full Report
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 border-slate-300 dark:border-slate-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Terms Glossary */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <HelpCircle className="h-5 w-5" />
            Understanding the Metrics
          </CardTitle>
          <CardDescription>What these performance terms mean</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* p95 Response Time */}
            <div className="space-y-1">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                Response Time (p95)
              </dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400">
                The time it takes for 95% of requests to complete. This means that 95 out of 100 requests were faster than this time.
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Example: 578ms means most pages load in under 0.6 seconds.
                </span>
              </dd>
            </div>

            {/* Error Rate */}
            <div className="space-y-1">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                Error Rate
              </dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400">
                The percentage of requests that failed or returned errors. Lower is better.
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Example: 0% means no errors occurred during testing.
                </span>
              </dd>
            </div>

            {/* Throughput */}
            <div className="space-y-1">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                Throughput
              </dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400">
                The number of requests the server can handle per second. Higher numbers indicate better capacity.
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Example: 1.46/s means the server processed about 1.5 requests every second.
                </span>
              </dd>
            </div>

            {/* Virtual Users */}
            <div className="space-y-1">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                Virtual Users
              </dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400">
                Simulated staff members using the system at the same time. Tests how many people can work simultaneously.
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Example: 6 concurrent staff means 6 people logged in and working together.
                </span>
              </dd>
            </div>

            {/* p99 */}
            <div className="space-y-1">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                p99 (99th Percentile)
              </dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400">
                Similar to p95, but for 99% of requests. Shows worst-case performance for most users.
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Example: 762ms means even the slower requests are still under 1 second.
                </span>
              </dd>
            </div>

            {/* Test Duration */}
            <div className="space-y-1">
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">
                Test Duration
              </dt>
              <dd className="text-sm text-slate-600 dark:text-slate-400">
                How long the load test ran. Longer tests provide more reliable results.
                <span className="block mt-1 text-xs text-slate-500 dark:text-slate-500">
                  Example: 6 minutes simulates a typical work session.
                </span>
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Report Information
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                This report was generated using k6 Performance Testing Framework against the Railway.app production environment.
                All metrics represent measured production infrastructure performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default LoadTestReport;
