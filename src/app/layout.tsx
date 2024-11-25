import type { Metadata } from "next"
import "./globals.css"
import { RootLayoutClient } from "@/components/layout/root-layout"

export const metadata: Metadata = {
  title: "Midweave",
  description: "Curated Midjourney Style Library",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RootLayoutClient>{children}</RootLayoutClient>
}