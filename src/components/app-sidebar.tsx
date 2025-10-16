"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  User as UserIcon,
  ClipboardList,
  LifeBuoy,
  Settings,
  TvMinimalIcon,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from '@/context/auth-context';



const mainLinks = [
  { title: "Dashboard", href: "/", Icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", Icon: FileText },
  { title: "Candidates", href: "/candidates", Icon: UserIcon },
  { title: "Interviews", href: "/interviews", Icon: TvMinimalIcon },
]

const bottomLinks = [
  { title: "Help & Support", href: "/help", Icon: LifeBuoy },
  { title: "Settings", href: "/settings", Icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"; // only exact match for home
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5 mt-2">
          <Image src="/icon.png" alt="HyrePro logo" width={24} height={24} className="rounded-md" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">HyrePro</span>
        </Link>
            {/* <SidebarTrigger className="-ml-1" /> */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {mainLinks.map(({ title, href, Icon }) => {
              const active = isActive(href);
              return (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={active ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : undefined}
                  >
                    <Link href={href}>
                        <Icon className={active ? "text-white" : undefined} />
                        <span className={active ? "text-white" : undefined}>
                          {title}
                        </span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {bottomLinks.map(({ title, href, Icon }) => {
            const active = isActive(href);
            return (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={active ? "text-primary data-[active=true]:text-primary data-[active=true]:bg-primary/10" : undefined}
                >
                  <Link href={href}>
                    <Icon />
                    <span>{title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        {user && user.email ? (
          <NavUser user={{
            name: user.user_metadata?.name || user.email.split('@')[0] || 'User',
            email: user.email,
            avatar: user.user_metadata?.avatar_url || '',
          }} />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
