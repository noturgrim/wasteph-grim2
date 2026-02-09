import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Loader2,
  Trash2,
  ChevronsUpDown,
  User,
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNavigationByRole } from "../../config/navigation";

export function AppSidebar() {
  const { user, logout, isLoggingOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get navigation items based on user role and master sales status
  const navigation = getNavigationByRole(user?.role || "sales", user?.isMasterSales || false);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white dark:border-white/10 dark:bg-black/60 dark:backdrop-blur-xl"
    >
      {/* Logo Header */}
      <SidebarHeader
        className="border-b border-slate-200 dark:border-white/10"
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#15803d] to-[#16a34a] shadow-lg">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className="truncate font-black uppercase tracking-tight text-slate-900 dark:text-white"
                >
                  WastePH
                </span>
                <span
                  className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/40"
                >
                  CRM System
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {navigation.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40"
            >
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={`group relative overflow-hidden rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-[#15803d] to-[#16a34a] text-white shadow-lg"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                      >
                        <Link to={item.url}>
                          <Icon className="h-4 w-4" />
                          <span className="font-semibold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* User Section Footer */}
      <SidebarFooter
        className="border-t border-slate-200 dark:border-white/10"
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Avatar className="h-8 w-8 border-2 border-[#15803d]">
                    <AvatarFallback className="bg-gradient-to-br from-[#15803d] to-[#16a34a] text-xs font-bold text-white">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span
                      className="truncate font-bold text-slate-900 dark:text-white"
                    >
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span
                      className="truncate text-xs font-medium capitalize text-slate-500 dark:text-white/50"
                    >
                      {user?.role === "sales" && user?.isMasterSales
                        ? "Master Sales"
                        : user?.role}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-56 bg-white dark:bg-black/95 dark:border-white/10 dark:backdrop-blur-xl"
              >
                <DropdownMenuLabel
                  className="text-slate-900 dark:text-white"
                >
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator
                  className="bg-slate-200 dark:bg-white/10"
                />
                <DropdownMenuItem
                  onClick={() => navigate("/admin/account")}
                  className="text-slate-700 dark:text-white/80 dark:focus:bg-white/5 cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  className="bg-slate-200 dark:bg-white/10"
                />
                <DropdownMenuItem
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-500/10 dark:focus:text-red-400"
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
