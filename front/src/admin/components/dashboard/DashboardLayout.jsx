import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  TrendingUp,
  LogOut,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
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

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Inquiries", path: "/admin/inquiries", icon: UserPlus },
    { name: "Leads", path: "/admin/leads", icon: TrendingUp },
    { name: "Potentials", path: "/admin/potentials", icon: FileText },
    { name: "Contracted Clients", path: "/admin/clients", icon: Users },
  ];

  const getPageTitle = () => {
    const currentRoute = navigationItems.find(
      (item) => item.path === location.pathname
    );
    return currentRoute ? currentRoute.name : "Dashboard";
  };

  return (
    <SidebarProvider>
      <Sidebar>
        {/* Logo Header */}
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">WastePH</h1>
              <p className="text-xs text-muted-foreground">Admin CRM</p>
            </div>
          </div>
        </SidebarHeader>

        <Separator />

        {/* Navigation */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      tooltip={item.name}
                    >
                      <a href={item.path}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Section */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                <Avatar className="w-8 h-8 bg-emerald-600">
                  <AvatarFallback className="bg-emerald-600 text-white text-sm font-bold">
                    {user?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip="Logout">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset>
        {/* Top Bar */}
        <header className="flex h-auto min-h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4 lg:px-6 bg-background py-3 sm:py-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-2 sm:gap-0">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                {getPageTitle()}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Welcome back, {user?.full_name}
              </p>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
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
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
