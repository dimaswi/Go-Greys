import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Breadcrumbs from "./Breadcrumbs"

export default function Header() {
  return (
    <header className="sticky top-0 z-40 h-[60px] flex items-center justify-between border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex-shrink-0" />
        <Separator orientation="vertical" className="h-5 flex-shrink-0" />
        <Breadcrumbs />
      </div>
    </header>
  )
}
