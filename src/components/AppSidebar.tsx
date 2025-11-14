import { LayoutDashboard, TrendingUp, TrendingDown, HandCoins, Receipt, FileText, LogOut, UserCog, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "In", url: "/in", icon: TrendingUp },
  { title: "Out", url: "/out", icon: TrendingDown },
  { title: "To Give", url: "/to-give", icon: HandCoins },
  { title: "Debt", url: "/debt", icon: Receipt },
  { title: "Reports", url: "/reports", icon: FileText },
];

const adminOnlyItems = [
  { title: "User Management", url: "/users", icon: UserCog },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-4 py-6 mb-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-elegant-lg p-0.5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <img 
                  src={logo} 
                  alt="Money Manager" 
                  className="w-full h-full object-cover scale-110" 
                />
              </div>
            </div>
            {state === "expanded" && (
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Money Manager
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                  Wallet CRM
                </span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      className="hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs">
              {state === "expanded" && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOnlyItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className="hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {state === "expanded" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2 space-y-2">
          {role && (
            <div className="px-2 py-1 text-xs text-muted-foreground capitalize">
              {state === "expanded" && `Role: ${role}`}
            </div>
          )}
          <Button
            onClick={() => navigate('/profile')}
            variant="ghost"
            size={state === "collapsed" ? "icon" : "default"}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <User className="h-4 w-4" />
            {state === "expanded" && <span className="ml-2">Profile</span>}
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size={state === "collapsed" ? "icon" : "default"}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {state === "expanded" && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
