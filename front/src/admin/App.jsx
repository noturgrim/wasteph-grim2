import { Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inquiries from "./pages/Inquiries";
import Leads from "./pages/Leads";
import Potentials from "./pages/Potentials";
import Clients from "./pages/Clients";
import BlogPosts from "./pages/BlogPosts";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ProposalTemplates from "./pages/ProposalTemplates";
import Proposals from "./pages/Proposals";

const CRMApp = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
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

            {/* Sales Pipeline - accessible by all roles */}
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="leads" element={<Leads />} />
            <Route path="potentials" element={<Potentials />} />
            <Route path="clients" element={<Clients />} />

            {/* Tools - Master Sales only */}
            <Route path="proposal-templates" element={<ProposalTemplates />} />

            {/* Admin only routes */}
            <Route
              path="proposals"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Proposals />
                </ProtectedRoute>
              }
            />
            <Route
              path="blog"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <BlogPosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default CRMApp;
