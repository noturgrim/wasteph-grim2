import { Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Inquiries from "./pages/Inquiries";
import Leads from "./pages/Leads";
import Clients from "./pages/Clients";
import BlogPosts from "./pages/BlogPosts";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ProposalTemplates from "./pages/ProposalTemplates";
import Proposals from "./pages/Proposals";
import ContractRequests from "./pages/ContractRequests";
import ContractTemplates from "./pages/ContractTemplates";
import Showcase from "./pages/Showcase";
import ClientsShowcase from "./pages/ClientsShowcase";
import InAppBrowserBanner from "../components/common/InAppBrowserBanner";

const CRMApp = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
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
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />

            {/* Sales Pipeline - accessible by all roles */}
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="leads" element={<Leads />} />
            <Route path="clients" element={<Clients />} />

            {/* Tools - Master Sales only */}
            <Route path="proposal-templates" element={<ProposalTemplates />} />
            <Route path="contract-templates" element={<ContractTemplates />} />

            {/* Admin / Super Admin routes */}
            <Route
              path="proposals"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
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
              path="settings"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default CRMApp;
