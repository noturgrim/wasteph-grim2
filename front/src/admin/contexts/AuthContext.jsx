import { createContext, useContext, useState, useEffect } from "react";
import { api, clearCsrfToken } from "../services/api";
import socketService from "../services/socketService";
import ticketSocketService from "../services/ticketSocketService";
import proposalSocketService from "../services/proposalSocketService";
import contractSocketService from "../services/contractSocketService";
import { leadSocketService } from "../services/leadSocketService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();

    // Cleanup socket on unmount
    return () => {
      if (socketService.isSocketConnected()) {
        ticketSocketService.cleanup();
        proposalSocketService.cleanup();
        contractSocketService.cleanup();
        leadSocketService.unsubscribeFromLeads();
        socketService.disconnect();
      }
    };
  }, []);

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (user && !socketService.isSocketConnected()) {
      initializeSocket();
    } else if (!user && socketService.isSocketConnected()) {
      ticketSocketService.cleanup();
      proposalSocketService.cleanup();
      contractSocketService.cleanup();
      leadSocketService.unsubscribeFromLeads();
      socketService.disconnect();
      setIsSocketConnected(false);
    }
  }, [user]);

  const initializeSocket = () => {
    try {
      // Register event handlers BEFORE connecting
      // Handle connection success
      socketService.on("connection:success", (data) => {
        console.log("Connection established");
        setIsSocketConnected(true);

        // Initialize feature-specific socket services
        ticketSocketService.initialize();
        proposalSocketService.initialize();
        contractSocketService.initialize();
        // Note: leadSocketService is initialized per-page, not globally
      });

      // Handle connection failure
      socketService.on("connection:failed", (data) => {
        console.error("❌ Real-time connection failed:", data.error);
        setIsSocketConnected(false);
      });

      // Now connect (this triggers the events)
      socketService.connect();
    } catch (error) {
      console.error("Socket initialization error:", error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      // User not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || "Login failed" };
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      // Cleanup socket services before logout
      if (socketService.isSocketConnected()) {
        leadSocketService.unsubscribeFromLeads();
        ticketSocketService.cleanup();
        proposalSocketService.cleanup();
        socketService.disconnect();
      }

      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearCsrfToken();
      setUser(null);
      setIsSocketConnected(false);
      setIsLoggingOut(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isLoggingOut,
        checkAuth,
        refreshUser,
        isSocketConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
