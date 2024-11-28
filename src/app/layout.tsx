import type { Metadata } from "next"
import "./globals.css"
import { Libre_Franklin } from "next/font/google"
import { RootLayoutClient } from "@/components/layout/root-layout"
import Script from "next/script"

const libreFranklin = Libre_Franklin({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-libre-franklin',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Midweave",
  description: "Curated Midjourney Style Library",
}

function EnvironmentScript() {
  // Only include NEXT_PUBLIC_ environment variables
  const publicEnvVars = Object.entries(process.env)
    .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  return (
    <Script
      id="environment-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `window.env = ${JSON.stringify(publicEnvVars)}`,
      }}
    />
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={libreFranklin.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <EnvironmentScript />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}