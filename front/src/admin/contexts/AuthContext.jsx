import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import socketService from "../services/socketService";
import ticketSocketService from "../services/ticketSocketService";
import proposalSocketService from "../services/proposalSocketService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();

    // Cleanup socket on unmount
    return () => {
      if (socketService.isSocketConnected()) {
        ticketSocketService.cleanup();
        proposalSocketService.cleanup();
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
      socketService.disconnect();
      setIsSocketConnected(false);
    }
  }, [user]);

  const initializeSocket = () => {
    try {
      // Register event handlers BEFORE connecting
      // Handle connection success
      socketService.on("connection:success", (data) => {
        console.log("✅ Real-time connection established");
        setIsSocketConnected(true);

        // Initialize feature-specific socket services
        ticketSocketService.initialize();
        proposalSocketService.initialize();
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
    try {
      // Cleanup socket before logout
      if (socketService.isSocketConnected()) {
        ticketSocketService.cleanup();
        proposalSocketService.cleanup();
        socketService.disconnect();
      }

      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsSocketConnected(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      checkAuth,
      isSocketConnected 
    }}>
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
