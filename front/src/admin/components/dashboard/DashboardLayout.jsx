import { Outlet, useLocation, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  TrendingUp,
  LogOut,
  Trash2,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import PageTransition from "../common/PageTransition";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigationItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Inquiries", path: "/admin/inquiries", icon: UserPlus },
    { name: "Leads", path: "/admin/leads", icon: TrendingUp },
    { name: "Potentials", path: "/admin/potentials", icon: FileText },
    { name: "Contracted Clients", path: "/admin/clients", icon: Users },
    { name: "Blog Posts", path: "/admin/blog", icon: BookOpen },
  ];

  const getPageTitle = () => {
    const currentRoute = navigationItems.find(
      (item) => item.path === location.pathname
    );
    return currentRoute ? currentRoute.name : "Dashboard";
  };

  return (
    <SidebarProvider>
      <Sidebar
        className={`border-r backdrop-blur-xl ${
          theme === "dark"
            ? "border-white/10 bg-black/60"
            : "border-slate-200 bg-white"
        }`}
      >
        {/* Logo Header */}
        <SidebarHeader
          className={`border-b ${
            theme === "dark" ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#15803d] to-[#16a34a] shadow-lg">
              <Trash2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1
                className={`text-lg font-black uppercase tracking-tight ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                WastePH
              </h1>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === "dark" ? "text-white/40" : "text-slate-500"
                }`}
              >
                CRM System
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel
              className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-widest ${
                theme === "dark" ? "text-white/40" : "text-slate-400"
              }`}
            >
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      tooltip={item.name}
                      className={`group relative overflow-hidden rounded-lg transition-all duration-200 ${
                        location.pathname === item.path
                          ? "bg-linear-to-r from-[#15803d] to-[#16a34a] text-white shadow-lg"
                          : theme === "dark"
                          ? "text-white/60 hover:bg-white/5 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Link
                        to={item.path}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="font-semibold">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Section */}
        <SidebarFooter
          className={`border-t p-3 ${
            theme === "dark" ? "border-white/10" : "border-slate-200"
          }`}
        >
          <SidebarMenu className="space-y-2">
            {/* Theme Toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                tooltip={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  theme === "dark"
                    ? "text-white/60 hover:bg-white/5 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 shrink-0" />
                    <span className="font-semibold">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 shrink-0" />
                    <span className="font-semibold">Dark Mode</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                  theme === "dark" ? "bg-white/5" : "bg-slate-100"
                }`}
              >
                <Avatar className="h-9 w-9 border-2 border-[#15803d]">
                  <AvatarFallback className="bg-linear-to-br from-[#15803d] to-[#16a34a] text-sm font-bold text-white">
                    {user?.firstName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className={`truncate text-sm font-bold ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p
                    className={`truncate text-xs font-medium capitalize ${
                      theme === "dark" ? "text-white/50" : "text-slate-500"
                    }`}
                  >
                    {user?.role}
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={logout}
                tooltip="Logout"
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  theme === "dark"
                    ? "text-white/60 hover:bg-red-500/10 hover:text-red-400"
                    : "text-slate-600 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="font-semibold">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset className="dark:bg-[#0a1f0f] light:bg-slate-50">
        {/* Top Bar */}
        <header
          className={`flex h-auto min-h-16 shrink-0 items-center gap-2 border-b px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-0 lg:px-6 ${
            theme === "dark"
              ? "border-white/10 bg-black/40"
              : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className={`mr-2 h-4 ${
              theme === "dark" ? "bg-white/10" : "bg-slate-300"
            }`}
          />
          <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
            <div className="min-w-0">
              <h2
                className={`truncate text-lg font-bold sm:text-xl lg:text-2xl ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                {getPageTitle()}
              </h2>
              <p
                className={`truncate text-xs sm:text-sm ${
                  theme === "dark" ? "text-white/50" : "text-slate-500"
                }`}
              >
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <span
              className={`whitespace-nowrap text-xs sm:text-sm ${
                theme === "dark" ? "text-white/40" : "text-slate-400"
              }`}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6">
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

export default DashboardLayout;
