"use client"

import Link from "next/link"
import { Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header className={cn("h-16 border-b bg-background", className)} {...props}>
      <div className="container h-full mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Wand2 className="h-6 w-6" />
          <span className="font-semibold text-lg">Midweave</span>
        </Link>
        {children}
      </div>
    </header>
  )
} 