"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload, Library, Settings, Link } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ className, onTabChange, ...props }: SidebarProps) {
  return (
    <div className={cn("pb-12 w-64 border-r h-full", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onTabChange?.('upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onTabChange?.('url-upload')}
            >
              <Link className="mr-2 h-4 w-4" />
              Upload from URL
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onTabChange?.('manage')}
            >
              <Library className="mr-2 h-4 w-4" />
              Library
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onTabChange?.('settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 