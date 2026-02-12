import { Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { getDefaultRoute } from "./config/navigation";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Inquiries from "./pages/Inquiries";
import Leads from "./pages/Leads";
import Clients from "./pages/Clients";
import Tickets from "./pages/Tickets";
import BlogPosts from "./pages/BlogPosts";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Account from "./pages/Account";
import ProposalTemplates from "./pages/ProposalTemplates";
import Proposals from "./pages/Proposals";
import ContractRequests from "./pages/ContractRequests";
import ContractTemplates from "./pages/ContractTemplates";
import Showcase from "./pages/Showcase";
import ClientsShowcase from "./pages/ClientsShowcase";
import Files from "./pages/Files";
import LoadTestReport from "./pages/LoadTestReport";
import InAppBrowserBanner from "../components/common/InAppBrowserBanner";

const IndexRedirect = () => {
  const { user } = useAuth();
  const defaultRoute = getDefaultRoute(user?.role || "sales");
  return <Navigate to={defaultRoute} replace />;
};

const CRMApp = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <InAppBrowserBanner />
          <Toaster position="top-right" />
          <Routes>
          <Route path="login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<IndexRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="account" element={<Account />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="files" element={<Files />} />

            {/* Sales Pipeline - accessible by all roles */}
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="leads" element={<Leads />} />
            <Route path="clients" element={<Clients />} />

            {/* Support - accessible by all roles */}
            <Route path="tickets" element={<Tickets />} />

            {/* Tools - Master Sales only */}
            <Route path="proposal-templates" element={<ProposalTemplates />} />
            <Route path="contract-templates" element={<ContractTemplates />} />

            {/* Admin / Super Admin routes */}
            <Route
              path="proposals"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin", "sales"]}>
                  <Proposals />
                </ProtectedRoute>
              }
            />
            <Route path="contract-requests" element={<ContractRequests />} />

            {/* Content routes - Social Media + Super Admin */}
            <Route
              path="blog"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "social_media"]}>
                  <BlogPosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="showcase"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "social_media"]}>
                  <Showcase />
                </ProtectedRoute>
              }
            />
            <Route
              path="clients-showcase"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "social_media"]}>
                  <ClientsShowcase />
                </ProtectedRoute>
              }
            />

            {/* Super Admin only routes */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/load-test"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                  <LoadTestReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to role default */}
          <Route path="*" element={<IndexRedirect />} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default CRMApp;
