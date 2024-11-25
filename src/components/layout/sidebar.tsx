"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Sidebar as ShadcnSidebar, 
  SidebarProvider 
} from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Upload, 
  Library, 
  Settings,
  PanelLeftClose,
  Menu
} from "lucide-react"
import { useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultTab?: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ className, defaultTab = "upload", onTabChange }: SidebarProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onTabChange(tab)
    if (isMobile) {
      setIsOpen(false)
    }
  }

  const NavContent = () => (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="space-y-1">
          <Button
            variant={activeTab === "upload" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("upload")}
          >
            <Upload className="h-4 w-4 mr-2 shrink-0" />
            <span className={cn(
              "transition-all duration-200",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              Upload
            </span>
          </Button>
          <Button
            variant={activeTab === "manage" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("manage")}
          >
            <Library className="h-4 w-4 mr-2 shrink-0" />
            <span className={cn(
              "transition-all duration-200",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              Manage Library
            </span>
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleTabChange("settings")}
          >
            <Settings className="h-4 w-4 mr-2 shrink-0" />
            <span className={cn(
              "transition-all duration-200",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              Settings
            </span>
          </Button>
        </div>
      </div>
    </div>
  )

  // Mobile sidebar
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          <ScrollArea className="h-full">
            <NavContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop sidebar
  return (
    <div className="relative h-full">
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-5 top-3 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent hover:text-accent-foreground"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <PanelLeftClose 
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isCollapsed && "rotate-180"
          )} 
        />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div 
        className={cn(
          "h-full border-r bg-background transition-all duration-200",
          isCollapsed ? "w-[56px]" : "w-64"
        )}
      >
        <ScrollArea className="h-full">
          <NavContent />
        </ScrollArea>
      </div>
    </div>
  )
} 