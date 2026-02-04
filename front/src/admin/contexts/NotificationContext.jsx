import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import socketService from "../services/socketService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isSocketConnected } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Setup socket listeners
  useEffect(() => {
    if (!isSocketConnected) return;

    const handleNewNotification = (notification) => {
      console.log("📬 New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationRead = ({ notificationId }) => {
      console.log("📖 Notification marked as read:", notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleAllRead = ({ count }) => {
      console.log("📖 All notifications marked as read:", count);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    };

    socketService.on("notification:new", handleNewNotification);
    socketService.on("notification:read", handleNotificationRead);
    socketService.on("notification:allRead", handleAllRead);

    return () => {
      socketService.off("notification:new", handleNewNotification);
      socketService.off("notification:read", handleNotificationRead);
      socketService.off("notification:allRead", handleAllRead);
    };
  }, [isSocketConnected]);

  const fetchNotifications = async (limit = 20) => {
    try {
      setIsLoading(true);
      const response = await api.getNotifications({ limit });
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      // Socket will handle UI update via handleNotificationRead
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      // Socket will handle UI update via handleAllRead
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
