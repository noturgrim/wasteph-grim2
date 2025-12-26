import { Outlet, useLocation, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Bell, Moon, Sun } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import PageTransition from "../common/PageTransition";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    return navigationMap[location.pathname] || { name: "Dashboard", parent: null };
  };

  const currentNav = getCurrentNav();

  // Mock notification count - replace with real data
  const notificationCount = 3;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with Breadcrumbs, Notifications, Theme Toggle */}
        <header
          className={`flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
            theme === "dark"
              ? "border-b border-white/10 bg-black/40 backdrop-blur-xl"
              : "border-b border-slate-200 bg-white shadow-sm"
          }`}
        >
          <div className="flex w-full items-center justify-between gap-2 px-4">
            {/* Left side: Trigger, Separator, Breadcrumbs */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className={`mr-2 h-4 ${
                  theme === "dark" ? "bg-white/10" : "bg-slate-300"
                }`}
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {currentNav.parent && (
                    <>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink asChild>
                          <Link
                            to={currentNav.parent}
                            className={
                              theme === "dark"
                                ? "text-white/60 hover:text-white"
                                : "text-slate-600 hover:text-slate-900"
                            }
                          >
                            {navigationMap[currentNav.parent]?.name || "Dashboard"}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  )}
                  <BreadcrumbItem>
                    <BreadcrumbPage
                      className={
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }
                    >
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
                    className="relative"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={`w-80 ${
                    theme === "dark"
                      ? "bg-black/95 border-white/10 backdrop-blur-xl"
                      : "bg-white"
                  }`}
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3
                      className={`font-semibold ${
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Notifications
                    </h3>
                  </div>
                  <DropdownMenuItem
                    className={
                      theme === "dark"
                        ? "text-white/80 focus:bg-white/5"
                        : "text-slate-700"
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">New inquiry received</p>
                      <p className="text-xs text-white/50">5 minutes ago</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      theme === "dark"
                        ? "text-white/80 focus:bg-white/5"
                        : "text-slate-700"
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">Lead converted to potential</p>
                      <p className="text-xs text-white/50">1 hour ago</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      theme === "dark"
                        ? "text-white/80 focus:bg-white/5"
                        : "text-slate-700"
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">Client signed contract</p>
                      <p className="text-xs text-white/50">2 hours ago</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 overflow-y-auto p-4 md:p-6 ${
            theme === "dark" ? "bg-[#0a1f0f]" : "bg-white"
          }`}
        >
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
