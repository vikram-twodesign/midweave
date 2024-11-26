import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { RootLayoutClient } from "@/components/layout/root-layout"
import Script from "next/script"

const inter = Inter({ 
  subsets: ['latin'],
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
        __html: `window.__ENV__ = ${JSON.stringify(publicEnvVars)};`,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <EnvironmentScript />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}