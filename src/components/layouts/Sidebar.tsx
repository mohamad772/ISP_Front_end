import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/auth-store";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  CreditCard,
  Network,
  FileText,
  Settings,
  ChevronLeft,
  Wifi,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    roles: ["admin", "pos_manager", "viewer", "support"],
  },
  { icon: Users, label: "Users", path: "/users", roles: ["admin"] },
  {
    icon: Building2,
    label: "POS Management",
    path: "/pos",
    roles: ["admin", "pos_manager"],
  },
  {
    icon: UserCircle,
    label: "Clients",
    path: "/clients",
    roles: ["admin", "pos_manager", "support"],
  },
  {
    icon: CreditCard,
    label: "Billing",
    path: "/billing",
    roles: ["admin", "pos_manager"],
  },
  { icon: Network, label: "Network", path: "/network", roles: ["admin"] },
  {
    icon: FileText,
    label: "Logs & Requests",
    path: "/logs",
    roles: ["admin", "pos_manager"],
  },
  { icon: Settings, label: "Settings", path: "/settings", roles: ["admin"] },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useStore();
  const [mouseY, setMouseY] = useState(0);
  const [isNearSidebar, setIsNearSidebar] = useState(false);
  const [autoExpanded, setAutoExpanded] = useState(false);

  // const filteredNav = navItems.filter(item =>
  //      user && item.roles.includes(user.role);
  // );
  const filteredNav = navItems.map((item) => item);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        setMouseY(e.clientY - rect.top);

        // Check if mouse is near the sidebar (within 100px from left edge)
        const isNear = e.clientX < 120;
        setIsNearSidebar(isNear);

        // Auto-expand when mouse is near and sidebar is collapsed
        if (collapsed && isNear && !autoExpanded) {
          setAutoExpanded(true);
        } else if (!isNear && autoExpanded) {
          setAutoExpanded(false);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [collapsed, autoExpanded]);

  const isExpanded = !collapsed || autoExpanded;

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-500 ease-in-out border-r border-sidebar-border fixed left-0 top-0 h-screen shrink-0 relative overflow-hidden z-40",
        isExpanded ? "w-64" : "w-16",
        "hidden md:flex",
      )}
    >
      {/* Animated Background Effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute w-full h-40 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent blur-3xl transition-all duration-300 ease-out"
          style={{ top: `${mouseY - 80}px` }}
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-grid-pattern-sidebar" />

      {/* Floating Orbs */}
      <div className="absolute top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border relative z-10 bg-sidebar/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative group">
            {/* Glow layers */}
            <div className="absolute inset-0 bg-primary/40 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse-glow" />
            <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

            {/* Logo container */}
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 overflow-hidden">
              {/* Inner shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

              <Wifi className="w-5 h-5 text-sidebar-primary-foreground relative z-10 transition-transform duration-300 group-hover:scale-110" />

              {/* Rotating border */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {isExpanded && (
            <span className="font-bold text-sidebar-accent-foreground transition-all duration-300 hover:text-primary">
              ISP Manager
            </span>
          )}
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-all duration-300 hover:scale-110 active:scale-95 group relative overflow-hidden"
        >
          {/* Button glow */}
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
          <ChevronLeft
            className={cn(
              "w-4 h-4 text-sidebar-foreground/80 relative z-10 transition-transform duration-300",
              isExpanded ? "rotate-0" : "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto relative z-10 custom-scrollbar">
        {filteredNav.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ animationDelay: `${index * 0.05}s` }}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden animate-fade-in-left",
                !isExpanded && "justify-center px-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:shadow-md",
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background gradient */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80 animate-gradient-flow" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                    {/* Active indicator line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full shadow-lg shadow-primary-foreground/50 animate-slide-in-right" />
                  </>
                )}

                {/* Hover shimmer */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                )}

                {/* Icon glow on hover */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute inset-0 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      isActive ? "bg-primary-foreground/30" : "bg-primary/30",
                    )}
                  />

                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 relative z-10 transition-all duration-300",
                      isActive
                        ? "scale-110 drop-shadow-lg"
                        : "group-hover:scale-110 group-hover:rotate-6 group-hover:text-primary",
                    )}
                  />
                </div>

                {isExpanded && (
                  <span
                    className={cn(
                      "relative z-10 font-medium transition-all duration-300",
                      isActive
                        ? "font-semibold"
                        : "group-hover:translate-x-1 group-hover:font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    <span className="text-sm font-medium">{item.label}</span>
                    {/* Tooltip arrow */}
                    <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-3 h-3 bg-popover border-l border-b border-border rotate-45" />
                  </div>
                )}

                {/* Particle effect on active */}
                {isActive && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary-foreground/50 rounded-full animate-particle-float"
                        style={{
                          left: `${20 + i * 30}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: `${2 + i * 0.5}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {isExpanded && user && (
        <div className="p-4 border-t border-sidebar-border relative z-10 bg-sidebar/80 backdrop-blur-sm animate-fade-in-up">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/60 transition-all duration-300 group cursor-pointer relative overflow-hidden">
            {/* Hover gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Avatar */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Avatar container */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:scale-110 overflow-hidden">
                {/* Inner shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

                <span className="text-sm font-bold text-primary-foreground relative z-10">
                  {user.username.charAt(0).toUpperCase()}
                </span>

                {/* Rotating ring */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-foreground/20 rounded-full transition-all duration-500 group-hover:rotate-180" />
              </div>
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm font-semibold truncate transition-colors duration-300 group-hover:text-primary">
                {user.username}
              </p>
              <p className="text-xs text-sidebar-muted capitalize transition-all duration-300 group-hover:text-muted-foreground">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isExpanded && user && (
        <div className="p-2 border-t border-sidebar-border relative z-10 bg-sidebar/80 backdrop-blur-sm flex justify-center animate-fade-in">
          <div className="relative group cursor-pointer">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Avatar container */}
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:scale-110 overflow-hidden">
              {/* Inner shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

              <span className="text-sm font-bold text-primary-foreground relative z-10">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none top-1/2 -translate-y-1/2">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role.replace("_", " ")}
              </p>
              {/* Tooltip arrow */}
              <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-3 h-3 bg-popover border-l border-b border-border rotate-45" />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(-10px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateY(-50%) translateX(-10px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes particle-float {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-20px); opacity: 1; }
        }

        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite 2s; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-gradient-flow { animation: gradient-flow 3s ease infinite; background-size: 200% 200%; }
        .animate-slide-in-right { animation: slide-in-right 0.4s ease-out; }
        .animate-fade-in-left { animation: fade-in-left 0.5s ease-out forwards; opacity: 0; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-particle-float { animation: particle-float ease-in-out infinite; }

        .bg-grid-pattern-sidebar {
          background-image: 
            linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.2);
          border-radius: 20px;
          transition: background 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.4);
        }
      `}</style>
    </aside>
  );
}
