"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import type { User } from "better-auth";
import { CheckSquare, LayoutDashboard, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Todos", href: "/dashboard/todos", icon: CheckSquare },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar({ user }: { user: User }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <p className="font-semibold">{user.name}</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} tooltip={item.title}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <SidebarMenuButton onClick={cycleTheme} tooltip="Toggle theme" className="flex-1">
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <span>Theme</span>
          </SidebarMenuButton>
          <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out" className="flex-1">
            <LogOut className="size-4" />
            <span>Sign out</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
