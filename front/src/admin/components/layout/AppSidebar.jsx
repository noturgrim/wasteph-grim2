import { Link, useLocation } from "react-router-dom";
import {
  LogOut,
  Trash2,
  ChevronsUpDown,
  User,
  Bell,
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
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  // Get navigation items based on user role
  const navigation = getNavigationByRole(user?.role || "sales");

  return (
    <Sidebar
      collapsible="icon"
      className={`border-r ${
        theme === "dark"
          ? "border-white/10 bg-black/60 backdrop-blur-xl"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Logo Header */}
      <SidebarHeader
        className={`border-b ${
          theme === "dark" ? "border-white/10" : "border-slate-200"
        }`}
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
                  className={`truncate font-black uppercase tracking-tight ${
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  WastePH
                </span>
                <span
                  className={`truncate text-xs font-semibold uppercase tracking-wider ${
                    theme === "dark" ? "text-white/40" : "text-slate-500"
                  }`}
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
              className={`text-[10px] font-bold uppercase tracking-widest ${
                theme === "dark" ? "text-white/40" : "text-slate-400"
              }`}
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
                            : theme === "dark"
                            ? "text-white/60 hover:bg-white/5 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
        className={`border-t ${
          theme === "dark" ? "border-white/10" : "border-slate-200"
        }`}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={`${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-100"
                  }`}
                >
                  <Avatar className="h-8 w-8 border-2 border-[#15803d]">
                    <AvatarFallback className="bg-gradient-to-br from-[#15803d] to-[#16a34a] text-xs font-bold text-white">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span
                      className={`truncate font-bold ${
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span
                      className={`truncate text-xs font-medium capitalize ${
                        theme === "dark" ? "text-white/50" : "text-slate-500"
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className={`w-56 ${
                  theme === "dark"
                    ? "bg-black/95 border-white/10 backdrop-blur-xl"
                    : "bg-white"
                }`}
              >
                <DropdownMenuLabel
                  className={
                    theme === "dark" ? "text-white" : "text-slate-900"
                  }
                >
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator
                  className={
                    theme === "dark" ? "bg-white/10" : "bg-slate-200"
                  }
                />
                <DropdownMenuItem
                  className={
                    theme === "dark"
                      ? "text-white/80 focus:bg-white/5"
                      : "text-slate-700"
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={
                    theme === "dark"
                      ? "text-white/80 focus:bg-white/5"
                      : "text-slate-700"
                  }
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  className={
                    theme === "dark" ? "bg-white/10" : "bg-slate-200"
                  }
                />
                <DropdownMenuItem
                  onClick={logout}
                  className={
                    theme === "dark"
                      ? "text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      : "text-red-600 focus:bg-red-50 focus:text-red-600"
                  }
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
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
