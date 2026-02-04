import { Outlet, useLocation, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Bell, Moon, Sun, Settings, MoreVertical } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageTransition from "../common/PageTransition";
import { AppSidebar } from "./AppSidebar";

const SalesLayout = () => {
  const { toggleTheme } = useTheme();
  const location = useLocation();

  // Navigation mapping for breadcrumbs
  const navigationMap = {
    "/admin/dashboard": { name: "Dashboard", parent: null },
    "/admin/inquiries": { name: "Inquiries", parent: "/admin/dashboard" },
    "/admin/leads": { name: "Leads", parent: "/admin/dashboard" },
    "/admin/potentials": { name: "Potentials", parent: "/admin/dashboard" },
    "/admin/clients": { name: "Clients", parent: "/admin/dashboard" },
    "/admin/blog": { name: "Blog Posts", parent: "/admin/dashboard" },
    "/admin/users": { name: "Users", parent: "/admin/dashboard" },
    "/admin/settings": { name: "Settings", parent: "/admin/dashboard" },
  };

  const getCurrentNav = () => {
    return (
      navigationMap[location.pathname] || { name: "Dashboard", parent: null }
    );
  };

  const currentNav = getCurrentNav();

  // Mock notification count - replace with real data
  const notificationCount = 3;

  const notifications = [
    {
      id: 1,
      name: "Jackie Monroe",
      action: "requests permission to change",
      entity: "Design System",
      context: "Project",
      time: "5 min ago",
      statusDot: "blue",
    },
    {
      id: 2,
      name: "Chris Graham",
      action: "has added a new employee",
      entity: "Mobile App",
      context: "Employee",
      time: "28 min ago",
      statusDot: "blue",
    },
    {
      id: 3,
      name: "Paul Miller",
      action: "has uploaded a new file",
      entity: "Keynote Presentation",
      context: "Vendor & Client",
      time: "3 days ago",
      statusDot: "red",
    },
    {
      id: 4,
      name: "Sarah Chen",
      action: "New inquiry received",
      entity: "",
      context: "Inquiry",
      time: "1 hour ago",
      statusDot: null,
    },
    {
      id: 5,
      name: "System",
      action: "Lead converted to potential",
      entity: "",
      context: "Lead",
      time: "2 hours ago",
      statusDot: null,
    },
    {
      id: 6,
      name: "System",
      action: "Client signed contract",
      entity: "",
      context: "Contract",
      time: "3 hours ago",
      statusDot: null,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with Breadcrumbs, Notifications, Theme Toggle */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-xl">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            {/* Left side: Trigger, Separator, Breadcrumbs */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4 bg-slate-300 dark:bg-white/10"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {currentNav.parent && (
                    <>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink asChild>
                          <Link
                            to={currentNav.parent}
                            className="text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
                          >
                            {navigationMap[currentNav.parent]?.name ||
                              "Dashboard"}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  )}
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-slate-900 dark:text-white">
                      {currentNav.name}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Right side: Notifications and Theme Toggle */}
            <div className="flex items-center gap-2">
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 border-0 shadow-sm dark:bg-gray-800 dark:hover:bg-gray-700"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5 text-green-700 dark:text-green-400" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-96 p-0 border-0 rounded-xl shadow-lg overflow-hidden bg-gray-50 dark:bg-slate-900"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Notification settings"
                    >
                      <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  {/* Notification list */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif, index) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          index > 0
                            ? "border-t border-gray-200 dark:border-slate-700"
                            : ""
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">
                              {notif.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          {notif.statusDot && (
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-50 dark:border-slate-900 ${
                                notif.statusDot === "blue"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 dark:text-slate-200">
                            <span className="font-semibold">{notif.name}</span>{" "}
                            {notif.action}
                            {notif.entity && (
                              <>
                                {" "}
                                <span className="font-semibold">
                                  {notif.entity}
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-xs mt-0.5 text-slate-500">
                            {notif.context} • {notif.time}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 shrink-0"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 border-0 shadow-sm dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 text-green-700 dark:text-green-400 hidden dark:block" />
                <Moon className="h-5 w-5 text-green-700 dark:text-green-400 dark:hidden" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0a1f0f]">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SalesLayout;
