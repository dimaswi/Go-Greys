import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Users,
  LayoutDashboard,
  Settings,
  School,
  LogOut,
  Calculator
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useSiteConfig } from "@/context/SiteConfigContext"
import { resolveAssetUrl } from "@/lib/runtime"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { config } = useSiteConfig()

  const navGroups: any[] = []

  // Menu Utama (Tersedia untuk semua yang login)
  navGroups.push({
    title: "Utama",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  })

  // Menu Klinik
  const isAdmin = user?.role?.toLowerCase() === "admin"
  const klinikItems = []

  if (isAdmin || user?.permissions?.includes("patients.view")) {
    klinikItems.push({ title: "Pasien", url: "/patients", icon: Users })
  }
  if (isAdmin || user?.permissions?.includes("visits.view")) {
    klinikItems.push({ title: "Antrean & Kunjungan", url: "/visits", icon: LayoutDashboard })
  }
  if (isAdmin || user?.permissions?.includes("treatments.view")) {
    klinikItems.push({ title: "Master Tindakan", url: "/treatments", icon: Settings })
  }
  if (isAdmin || user?.permissions?.includes("payroll.view")) {
    klinikItems.push({ title: "Penggajian", url: "/payroll/list", icon: Calculator })
  }

  if (klinikItems.length > 0) {
    navGroups.push({
      title: "Klinik & Penggajian",
      items: klinikItems
    })
  }

  // Menu Sistem
  const sistemItems = []
  if (isAdmin || user?.permissions?.includes("users.view")) {
    sistemItems.push({ title: "Pengguna", url: "/users", icon: Users })
  }
  if (isAdmin || user?.permissions?.includes("roles.view")) {
    sistemItems.push({ title: "Roles & Akses", url: "/roles", icon: Settings })
  }
  if (isAdmin || user?.permissions?.includes("roles.edit")) {
    sistemItems.push({ title: "Pengaturan Branding", url: "/settings/brand", icon: Settings })
  }
  if (sistemItems.length > 0) {
    navGroups.push({ title: "Sistem", items: sistemItems })
  }



  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Brand Header ── */}
      {/* Hapus padding default p-2 dari SidebarHeader agar kita bisa atur padding manual */}
      <SidebarHeader className="h-[60px] border-b border-sidebar-border p-0">
        {/* Ketika expanded: px-3, ketika collapsed: px-0 & justify-center agar ikon sempurna di tengah 48px */}
        <div className="flex h-full w-full items-center px-4 gap-3 overflow-hidden group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-none flex items-center justify-center overflow-hidden">
            {config.logo_url ? (
              <img src={resolveAssetUrl(config.logo_url)} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <School className="h-4 w-4 text-white" />
            )}
          </div>
          {/* Text: hidden via CSS ketika collapsed */}
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-accent-foreground leading-tight truncate">
              {config.app_name}
            </span>
            <span className="text-[11px] text-sidebar-foreground/50 leading-tight">
              {config.subtitle}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav Content ── */}
      <SidebarContent className="px-2 pt-2 pb-2">
        {navGroups.map((group, idx) => (
          <SidebarGroup key={group.title} className={`p-0 ${idx > 0 ? "mt-1" : ""}`}>
            {/* Group label — hidden when collapsed */}
            <SidebarGroupLabel className="h-6 px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item: any) => {
                  const isActive = location.pathname === item.url ||
                    (item.url !== "/" && location.pathname.startsWith(item.url))
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-8 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium"
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer ── */}
      <div className="mt-auto border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Keluar"
              className="h-8 rounded-md text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      <SidebarRail />
    </Sidebar>
  )
}
