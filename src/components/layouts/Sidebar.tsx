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

  // const filteredNav = navItems.filter(item =>
  //      user && item.roles.includes(user.role);
  // );
  const filteredNav = navItems.map((item) => item);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64",
        "hidden md:flex",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Wifi className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-accent-foreground">
              ISP Manager
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "sidebar-item",
                isActive && "sidebar-item-active",
                collapsed && "justify-center px-2",
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.username.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-sidebar-muted capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
