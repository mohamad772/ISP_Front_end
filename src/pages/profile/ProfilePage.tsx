import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Shield,
  Building2,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/store/auth-store";

export function ProfilePage() {
  const { user } = useStore();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      // TODO: Implement password change API call
      // await changePassword(passwords.current, passwords.new);
      toast({ title: "Password changed successfully" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch {
      toast({
        title: "Failed to change password",
        description: "Check your current password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10">
        <PageHeader
          title="My Profile"
          description="Manage your account settings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 relative z-10">
        <Card className="group relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] border-border/50 animate-in slide-in-from-left-8 duration-1000 delay-150">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Floating orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700 -translate-y-1/2 translate-x-1/2 group-hover:scale-150" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-1/2 -translate-x-1/2" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000 ease-in-out" />
          </div>

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                <User className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Account Information
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            <div className="relative p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 group-hover:border-primary/40 transition-all duration-500 overflow-hidden animate-in zoom-in duration-700 delay-300">
              {/* Animated border glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
              </div>

              {/* Sparkle effects */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>

              <div className="flex items-center gap-5 relative z-10">
                <div className="relative group/avatar">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover/avatar:scale-110 group-hover/avatar:rotate-6 ring-4 ring-primary/20 group-hover/avatar:ring-primary/40 animate-in zoom-in duration-500 delay-400">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Online status with pulse animation */}
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-4 border-card shadow-lg">
                    <div className="absolute inset-1 bg-white rounded-full animate-pulse" />
                  </div>

                  {/* Avatar glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/40 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700 blur-2xl -z-10 scale-150 animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text animate-in slide-in-from-right duration-500 delay-500">
                    {user.username}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 animate-in slide-in-from-right duration-500 delay-600">
                    @{user.username}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="group/item relative overflow-hidden flex items-center gap-4 p-5 bg-muted/30 hover:bg-muted/50 rounded-2xl transition-all duration-500 border border-transparent hover:border-primary/20 hover:shadow-lg animate-in slide-in-from-left duration-700 delay-400">
                {/* Sliding gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000 ease-in-out" />

                <div className="relative p-3 rounded-xl bg-background/80 backdrop-blur-sm group-hover/item:bg-primary/10 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-12 shadow-md">
                  <Mail className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 group-hover/item:text-primary transition-colors duration-300">
                    Email
                  </p>
                  <p className="font-bold text-base truncate">{user.email}</p>
                </div>
              </div>

              <div className="group/item relative overflow-hidden flex items-center gap-4 p-5 bg-muted/30 hover:bg-muted/50 rounded-2xl transition-all duration-500 border border-transparent hover:border-primary/20 hover:shadow-lg animate-in slide-in-from-left duration-700 delay-450">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000 ease-in-out" />

                <div className="relative p-3 rounded-xl bg-background/80 backdrop-blur-sm group-hover/item:bg-primary/10 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-12 shadow-md">
                  <Shield className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 group-hover/item:text-primary transition-colors duration-300">
                    Role
                  </p>
                  <p className="font-bold text-base capitalize">
                    {user.role.replace("_", " ").toLowerCase()}
                  </p>
                </div>
              </div>

              {user.pos && (
                <div className="group/item relative overflow-hidden flex items-center gap-4 p-5 bg-muted/30 hover:bg-muted/50 rounded-2xl transition-all duration-500 border border-transparent hover:border-primary/20 hover:shadow-lg animate-in slide-in-from-left duration-700 delay-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000 ease-in-out" />

                  <div className="relative p-3 rounded-xl bg-background/80 backdrop-blur-sm group-hover/item:bg-primary/10 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-12 shadow-md">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 group-hover/item:text-primary transition-colors duration-300">
                      Assigned POS
                    </p>
                    <p className="font-bold text-base">{user.pos.name}</p>
                  </div>
                </div>
              )}
            </div>

            {user.capabilities && user.capabilities.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-550">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="group/badge relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-xs font-semibold border border-primary/30 hover:border-primary/50 hover:shadow-lg transition-all duration-500 cursor-default animate-in zoom-in hover:scale-105"
                      style={{ animationDelay: `${i * 60 + 550}ms` }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500" />
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-700 ease-in-out" />
                      <span className="relative z-10">{cap}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] border-border/50 animate-in slide-in-from-right-8 duration-1000 delay-150">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700 translate-y-1/2 -translate-x-1/2 group-hover:scale-150" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-y-1/2 translate-x-1/2" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-full group-hover:-translate-x-full transition-transform duration-2000 ease-in-out" />
          </div>

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                <Lock className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Change Password
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-2 animate-in slide-in-from-right duration-700 delay-300">
                <Label htmlFor="current" className="text-sm font-semibold">
                  Current Password
                </Label>
                <div className="relative group/input">
                  <Input
                    id="current"
                    type="password"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    className="transition-all duration-500 focus:ring-2 focus:ring-primary/30 focus:border-primary border-2 h-12 text-base bg-muted/30 group-hover/input:bg-muted/50"
                    required
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute inset-0 rounded-lg border-2 border-primary/20 opacity-0 group-hover/input:opacity-100 group-hover/input:scale-105 transition-all duration-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 animate-in slide-in-from-right duration-700 delay-350">
                <Label htmlFor="new" className="text-sm font-semibold">
                  New Password
                </Label>
                <div className="relative group/input">
                  <Input
                    id="new"
                    type="password"
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    className="transition-all duration-500 focus:ring-2 focus:ring-primary/30 focus:border-primary border-2 h-12 text-base bg-muted/30 group-hover/input:bg-muted/50"
                    required
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute inset-0 rounded-lg border-2 border-primary/20 opacity-0 group-hover/input:opacity-100 group-hover/input:scale-105 transition-all duration-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 animate-in slide-in-from-right duration-700 delay-400">
                <Label htmlFor="confirm" className="text-sm font-semibold">
                  Confirm New Password
                </Label>
                <div className="relative group/input">
                  <Input
                    id="confirm"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    className="transition-all duration-500 focus:ring-2 focus:ring-primary/30 focus:border-primary border-2 h-12 text-base bg-muted/30 group-hover/input:bg-muted/50"
                    required
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute inset-0 rounded-lg border-2 border-primary/20 opacity-0 group-hover/input:opacity-100 group-hover/input:scale-105 transition-all duration-500 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 animate-in slide-in-from-bottom duration-700 delay-450">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full h-12 text-base shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary relative overflow-hidden group/button"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 opacity-0 group-hover/button:opacity-100 transition-opacity duration-500" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000 ease-in-out" />
                  <span className="relative z-10 flex items-center justify-center">
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
