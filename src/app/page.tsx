"use client"

import { useState, useEffect } from "react"
import { getAllEntries } from "@/lib/services/storage"
import type { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { Header } from "@/components/layout/header"
import { ImageGrid } from "@/components/gallery/image-grid"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/utils"
import Link from "next/link"
import { Github, Twitter, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  const [entries, setEntries] = useState<ImageEntryWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await getAllEntries()
        setEntries(data)
      } catch (error) {
        console.error('Error loading entries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header className="border-b">
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Gallery
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
          </nav>
          <Button 
            variant="outline" 
            onClick={() => router.push(routes.admin)}
          >
            Admin
          </Button>
        </div>
      </Header>

      <main className="flex-1">
        <section className="relative overflow-hidden min-h-[600px] flex items-center bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-[length:400%_400%] animate-gradient">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6,#8b5cf6,#d946ef,#3b82f6)] opacity-50 mix-blend-soft-light animate-gradient-slow" />

          {/* Content */}
          <div className="container mx-auto px-4 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center justify-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 mb-8 shadow-lg">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                <span className="text-sm font-medium text-white">Discover the best Midjourney styles on the internet</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-6 sm:text-5xl text-white drop-shadow-md">
                Welcome to Midweave
              </h1>
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-white/90 drop-shadow">
                  A carefully curated collection of exceptional Midjourney styles and their parameters. 
                  Each image in our library has been hand-picked and analyzed to help you discover 
                  the perfect parameters for your next creation.
                </p>
                <p className="text-lg leading-relaxed text-white/90 drop-shadow">
                  Browse, search, and instantly copy any style settings that catch your eye—it's like 
                  a recipe book for Midjourney magic.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <ImageGrid entries={entries} isLoading={isLoading} />
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About Midweave</h3>
              <p className="text-sm text-muted-foreground">
                A modern platform for exploring and analyzing AI-generated artwork, 
                powered by advanced machine learning algorithms.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-primary">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <Link 
                  href="https://github.com/your-repo" 
                  target="_blank"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Github className="h-5 w-5" />
                </Link>
                <Link 
                  href="https://twitter.com/your-handle" 
                  target="_blank"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Midweave. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}