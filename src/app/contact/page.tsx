"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/utils"
import { motion } from "framer-motion"
import { Mail, MessageSquare, Phone, Github, Twitter } from "lucide-react"

export default function ContactPage() {
  const router = useRouter()

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
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-[length:400%_400%] animate-gradient min-h-[500px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6,#8b5cf6,#d946ef,#3b82f6)] opacity-50 mix-blend-soft-light animate-gradient-slow" />
          
          <div className="container mx-auto px-4 py-32 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl font-bold mb-8 text-white drop-shadow-md">Get in Touch</h1>
              <p className="text-lg text-white/90 mb-8 drop-shadow">
                Have questions about Midweave? We'd love to hear from you. Send us a message 
                and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto space-y-16">
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="flex flex-col items-center p-8 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <Mail className="h-8 w-8 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    support@midweave.com
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-8 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <MessageSquare className="h-8 w-8 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Available 9am-5pm EST
                  </p>
                </div>

                <div className="flex flex-col items-center p-8 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <Phone className="h-8 w-8 mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Phone</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    +1 (555) 123-4567
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
                <h2 className="text-2xl font-semibold mb-8">Send us a Message</h2>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded-md h-32"
                      placeholder="Your message..."
                    ></textarea>
                  </div>
                  <Button className="w-full">Send Message</Button>
                </form>
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