import { Outlet, useLocation, Link, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Bell, Moon, Sun, Settings, MoreVertical } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
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

/**
 * Freezes the outlet content at mount time so that during AnimatePresence
 * exit animations, the OLD page keeps rendering instead of switching to the
 * new route's component (which would cause a double mount/fetch).
 */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

export default function AppLayout() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation mapping for breadcrumbs
  const navigationMap = {
    "/admin/dashboard": { name: "Dashboard", parent: null },
    "/admin/inquiries": { name: "Inquiries", parent: "/admin/dashboard" },
    "/admin/leads": { name: "Leads", parent: "/admin/dashboard" },
    "/admin/clients": { name: "Clients", parent: "/admin/dashboard" },
    "/admin/proposals": { name: "Proposals", parent: "/admin/dashboard" },
    "/admin/contract-requests": {
      name: "Contract Requests",
      parent: "/admin/dashboard",
    },
    "/admin/proposal-templates": {
      name: "Proposal Templates",
      parent: "/admin/dashboard",
    },
    "/admin/contract-templates": {
      name: "Contract Templates",
      parent: "/admin/dashboard",
    },
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

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on entity type
    if (notification.entityType === "ticket" && notification.entityId) {
      // Navigate to tickets page with ticket ID in URL hash/state
      navigate(`/admin/tickets`, {
        state: { openTicketId: notification.entityId },
      });
    } else if (
      notification.entityType === "proposal" &&
      notification.entityId
    ) {
      navigate(`/admin/proposals`, {
        state: { openProposalId: notification.entityId },
      });
    } else if (
      notification.entityType === "contract" &&
      notification.entityId
    ) {
      navigate(`/admin/contract-requests`, {
        state: { openContractId: notification.entityId },
      });
    } else if (notification.entityType === "inquiry" && notification.entityId) {
      navigate(`/admin/inquiries`, {
        state: { openInquiryId: notification.entityId },
      });
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  };

  const getNotificationIcon = (type) => {
    // Return initials based on notification type
    const typeMap = {
      ticket_created: "TK",
      ticket_comment_added: "CM",
      ticket_status_changed: "ST",
      proposal_created: "PR",
      system: "SY",
    };
    return typeMap[type] || "NO";
  };

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
                    className="relative h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 border-0 shadow-sm dark:bg-white/10 dark:hover:bg-white/20"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5 text-slate-700 dark:text-green-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-96 p-0 border-0 rounded-xl shadow-lg overflow-hidden bg-gray-50 dark:bg-black/90 dark:backdrop-blur-xl"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif, index) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            index > 0
                              ? "border-t border-gray-200 dark:border-slate-700"
                              : ""
                          } ${
                            !notif.isRead
                              ? "bg-blue-50 dark:bg-blue-950/20"
                              : ""
                          }`}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback
                                className={`text-sm font-medium ${
                                  !notif.isRead
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                    : "bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {getNotificationIcon(notif.type)}
                              </AvatarFallback>
                            </Avatar>
                            {!notif.isRead && (
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-50 dark:border-slate-900 bg-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${
                                !notif.isRead
                                  ? "font-semibold text-slate-900 dark:text-white"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {notif.title}
                            </p>
                            <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-400">
                              {notif.message}
                            </p>
                            <p className="text-xs mt-1 text-slate-500">
                              {getTimeAgo(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 border-0 shadow-sm dark:bg-white/10 dark:hover:bg-white/20"
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 text-green-400 hidden dark:block" />
                <Moon className="h-5 w-5 text-slate-700 block dark:hidden" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#0a1f0f]">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <FrozenOutlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
