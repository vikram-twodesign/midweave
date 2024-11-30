"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/utils"
import { motion } from "framer-motion"
import { ImageSlideshow } from "@/components/gallery/image-slideshow"
import { getAllEntries, resyncLibrary } from "@/lib/services/storage"
import type { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { Github, Twitter } from "lucide-react"

export default function AboutPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<ImageEntryWithAnalysis[]>([])

  useEffect(() => {
    const loadEntries = async () => {
      try {
        // First try to get entries from local database
        const localEntries = await getAllEntries()
        
        // If no entries in local database, force a resync with GitHub
        if (localEntries.length === 0) {
          await resyncLibrary()
          const syncedEntries = await getAllEntries()
          setEntries(syncedEntries)
        } else {
          setEntries(localEntries)
          // Only trigger background sync if it's been more than 5 minutes since last sync
          const lastSync = localStorage.getItem('lastSync')
          const now = Date.now()
          if (!lastSync || now - parseInt(lastSync) > 5 * 60 * 1000) {
            resyncLibrary().then(async () => {
              const freshEntries = await getAllEntries()
              setEntries(freshEntries)
              localStorage.setItem('lastSync', now.toString())
            }).catch(console.warn) // Use warn instead of error for non-critical background sync
          }
        }
      } catch (error) {
        console.error('Error loading entries:', error)
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
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-[length:400%_400%] animate-gradient min-h-[700px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6,#8b5cf6,#d946ef,#3b82f6)] opacity-50 mix-blend-soft-light animate-gradient-slow" />
          
          <div className="container mx-auto px-4 py-32 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-4xl font-bold mb-12 text-white text-center drop-shadow-md">About Midweave</h1>
              
              <div className="prose prose-lg prose-invert mx-auto">
                <p className="text-lg text-white/90 drop-shadow mb-12">
                  Midweave was born from a simple idea: to create a curated space where artists and creators 
                  could discover and share the perfect Midjourney parameters for their creative projects.
                </p>

                {entries.length > 0 && (
                  <div className="mt-12">
                    <ImageSlideshow 
                      entries={entries} 
                      interval={6000} 
                      showNavigation={false}
                      showCaption={false}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto space-y-16">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Our Mission</h2>
                <p className="text-muted-foreground text-lg">
                  We believe that AI art generation should be accessible and inspiring. Our platform serves 
                  as a bridge between imagination and execution, helping creators find the perfect parameters 
                  to bring their visions to life.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">What We Offer</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-3 text-lg">
                  <li>Curated collection of exceptional Midjourney styles</li>
                  <li>Detailed parameter analysis for each image</li>
                  <li>Easy-to-copy settings for immediate use</li>
                  <li>Regular updates with new styles and techniques</li>
                </ul>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Join Our Community</h2>
                <p className="text-muted-foreground text-lg">
                  Whether you're a seasoned artist or just starting your journey with AI-generated art, 
                  Midweave is here to help you explore, create, and push the boundaries of what's possible 
                  with Midjourney.
                </p>
              </div>
            </div>
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
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 