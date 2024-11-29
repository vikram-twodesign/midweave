"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link
        href="/"
        className={cn(
          "transition-colors hover:text-foreground/80",
          pathname === "/" ? "text-foreground" : "text-foreground/60"
        )}
      >
        Gallery
      </Link>
      <Link
        href="/submit"
        className={cn(
          "transition-colors hover:text-foreground/80",
          pathname === "/submit" ? "text-foreground" : "text-foreground/60"
        )}
      >
        Submit
      </Link>
      <Link
        href="/admin"
        className={cn(
          "transition-colors hover:text-foreground/80",
          pathname === "/admin" ? "text-foreground" : "text-foreground/60"
        )}
      >
        Admin
      </Link>
    </nav>
  )
} 