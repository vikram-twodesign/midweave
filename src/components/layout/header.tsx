"use client"

import Link from "next/link"
import { Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors hover:text-foreground/80",
        pathname === href ? "text-foreground" : "text-foreground/60"
      )}
    >
      {children}
    </Link>
  )
}

export function Header({ className, ...props }: HeaderProps) {
  return (
    <header className={cn("h-16 border-b bg-background", className)} {...props}>
      <div className="container h-full mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Wand2 className="h-6 w-6" />
          <span className="font-semibold text-lg">Midweave</span>
        </Link>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <NavLink href="/">Gallery</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/submit">Submit</NavLink>
          <NavLink href="/contact">Contact</NavLink>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Admin
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
} 