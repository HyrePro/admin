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
  BarChartIcon,
} from "lucide-react"


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
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from '@/context/auth-context';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./ui/item"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"



const mainLinks = [
  { title: "Dashboard", href: "/", Icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", Icon: FileText },
  { title: "Candidates", href: "/candidates", Icon: UserIcon },
  { title: "Interviews", href: "/interviews", Icon: TvMinimalIcon },
  { title: "Analytics", href: "/analytics", Icon: BarChartIcon },
  { title: "Settings", href: "/settings", Icon: Settings },
]


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar(); // Add this hook to control mobile sidebar state

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"; // only exact match for home
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5 mt-2">
          <Image src="/icon.png" alt="Hyriki logo" width={24} height={24} className="rounded-md" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Hyriki</span>
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
                    className={`${active ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : undefined} hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 `}
                  >
                    <Link 
                      href={href} 
                      scroll={false}
                      onClick={() => {
                        // Close mobile sidebar when a link is clicked
                        setOpenMobile(false);
                      }}
                    >
                        <Icon size={18} className={active ? "text-white" : undefined} />
                        <span className={`${active ? "text-white" : 'text-blue'} hover: text-blue`}>
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
       <Item variant="outline" className="flex flex-col items-center justify-center border-dotted border-2 group-data-[collapsible=icon]:p-2">
        <ItemMedia className="flex items-center justify-center w-full group-data-[collapsible=icon]:hidden">
          <div className="flex *:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale items-center justify-center">
            <Avatar className="hidden sm:flex">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" 
                className="ring-background ring-2 h-8 w-8 rounded-full" 
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar className="hidden sm:flex">
              <AvatarImage
                src="https://github.com/maxleiter.png"
                alt="@maxleiter"
                className="ring-background ring-2 h-8 w-8 rounded-full" 

              />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
                className="ring-background ring-2 h-8 w-8 rounded-full" 
              />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </div>
        </ItemMedia>
        <ItemContent className="flex flex-col items-center justify-center text-center group-data-[collapsible=icon]:hidden">
          <ItemTitle>Need a new teacher?</ItemTitle>
          <ItemDescription className="text-center">
            Post a Job and start receiving applicants.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Link href="/jobs/create-job-post" passHref scroll={false}>
              <Button asChild variant="default" size="sm" className="sm:flex bg-white dark:bg-gray-950 border-2 border-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-padding group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:w-auto">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text group-data-[collapsible=icon]:bg-none group-data-[collapsible=icon]:text-white">
                  + Create Job Post
                </span>
              </Button>
            </Link>
        </ItemActions>
      </Item>
        
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}