import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Wifi,
} from "lucide-react";
import { useLogout } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useStore();
  const [notificationCount] = useState(3);

  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <header
      className={cn(
        "h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50",
        className,
      )}
    >
      <div className="h-full flex items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-accent transition-colors"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Wifi className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold hidden sm:block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              ISP Management System
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent transition-all duration-200 group"
          >
            <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-medium text-destructive-foreground animate-in fade-in zoom-in duration-200">
                {notificationCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-accent transition-all duration-200 group data-[state=open]:bg-accent"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="hidden sm:block font-medium">
                  {user?.username ?? "User"}
                </span>
                <ChevronDown className="w-4 h-4 hidden sm:block transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-base font-medium text-primary-foreground">
                      {user?.username?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user?.username ?? "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email ?? "-"}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer transition-colors"
                disabled={isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
