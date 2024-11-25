"use client"

import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from "react"

const inter = Inter({ subsets: ["latin"] })

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {mounted ? children : null}
        <Toaster />
      </body>
    </html>
  )
} 