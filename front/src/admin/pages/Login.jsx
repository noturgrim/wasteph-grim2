import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success("Login successful! Welcome back.");
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 500);
      } else {
        const errorMsg = result.message || "Invalid credentials";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || "An error occurred. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1f0f]">
      {/* Animated background gradients */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gradient orb */}
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#15803d]/20 blur-3xl" />

        {/* Secondary gradient orb */}
        <div
          className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 animate-pulse rounded-full bg-[#16a34a]/15 blur-3xl"
          style={{ animationDelay: "1s" }}
        />

        {/* Tertiary accent */}
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#052e16]/30 blur-2xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(21,128,61,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(21,128,61,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Brand */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-black uppercase tracking-tight text-white">
              WastePH CRM
            </h1>
            <p className="text-sm font-medium uppercase tracking-widest text-white/40">
              Customer Relationship Management
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-[#15803d]/20 bg-black/40 shadow-[0_0_80px_rgba(21,128,61,0.1)] backdrop-blur-2xl">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl font-bold text-white">
                Welcome back
              </CardTitle>
              <CardDescription className="text-white/50">
                Access for Admin, Sales & Marketing Teams
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-400 backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wide text-[#15803d]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <Input
                      type="email"
                      placeholder="sales@wasteph.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-white/10 bg-white/5 pl-11 text-white caret-white placeholder:text-white/30 focus:border-[#15803d]/50 focus:bg-white/10 focus:ring-[#15803d]/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wide text-[#15803d]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-white/10 bg-white/5 pl-11 pr-11 text-white caret-white placeholder:text-white/30 focus:border-[#15803d]/50 focus:bg-white/10 focus:ring-[#15803d]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                      tabIndex={0}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="group relative h-12 w-full overflow-hidden bg-gradient-to-r from-[#15803d] to-[#16a34a] font-bold uppercase tracking-wide text-white shadow-[0_0_30px_rgba(21,128,61,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(21,128,61,0.5)]"
                  disabled={isLoading}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </span>
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="rounded-lg border border-[#15803d]/20 bg-[#15803d]/5 px-4 py-2 text-xs font-medium text-white/50 backdrop-blur-sm">
                  Use your admin credentials to sign in
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs font-medium uppercase tracking-wider text-white/30">
            © 2026 WastePH. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
