import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { User, Mail, Shield, Calendar, Star, Camera } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ProfilePictureUpload from "@admin/components/profile/ProfilePictureUpload";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  sales: "Sales",
  social_media: "Social Media",
};

const ROLE_COLORS = {
  super_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sales: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  social_media: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, refreshUser } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());

  if (!user) return null;

  const initials =
    (user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "");

  const handleUploadSuccess = async () => {
    await refreshUser();
    // Force image re-render by updating key
    setImageKey(Date.now());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">Your account details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 pb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20" key={imageKey}>
                {user.profilePictureUrl && (
                  <AvatarImage
                    src={`${user.profilePictureUrl}#${imageKey}`}
                    alt={user.firstName}
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-[#15803d] to-[#16a34a] text-2xl font-bold text-white">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="mt-4 text-xl font-bold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge
                className={`${ROLE_COLORS[user.role] || ""} border-0`}
              >
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
              {user.isMasterSales && (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600 dark:text-amber-400"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Master Sales
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details are managed by an administrator. Contact
              your admin if any changes are needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DetailRow icon={User} label="Full Name">
              {user.firstName} {user.lastName}
            </DetailRow>
            <Separator />
            <DetailRow icon={Mail} label="Email Address">
              {user.email}
            </DetailRow>
            <Separator />
            <DetailRow icon={Shield} label="Role">
              <div className="flex items-center gap-2">
                <span>{ROLE_LABELS[user.role] || user.role}</span>
                {user.isMasterSales && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600 dark:text-amber-400 text-xs"
                  >
                    <Star className="mr-1 h-3 w-3" />
                    Master Sales
                  </Badge>
                )}
              </div>
            </DetailRow>
            <Separator />
            <DetailRow icon={Calendar} label="Member Since">
              {user.createdAt
                ? format(new Date(user.createdAt), "MMMM d, yyyy")
                : "N/A"}
            </DetailRow>
          </CardContent>
        </Card>
      </div>

      {/* Profile Picture Upload Dialog */}
      <ProfilePictureUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentUser={user}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
