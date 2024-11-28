"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { routes } from "@/lib/utils"
import { Github, Twitter } from "lucide-react"

export default function TermsPage() {
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
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Midweave, you accept and agree to be bound by the terms and 
                provisions of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Use License</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Permission is granted to temporarily access and use Midweave for personal, 
                  non-commercial purposes. This license does not include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>Modifying or copying the materials</li>
                  <li>Using the materials for commercial purposes</li>
                  <li>Attempting to reverse engineer any software contained on Midweave</li>
                  <li>Removing any copyright or proprietary notations</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. User Content</h2>
              <p className="text-muted-foreground">
                Users retain all rights to their content. By uploading content to Midweave, you grant 
                us a non-exclusive license to use, display, and distribute the content in connection 
                with our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Disclaimer</h2>
              <p className="text-muted-foreground">
                The materials on Midweave are provided on an 'as is' basis. We make no warranties, 
                expressed or implied, and hereby disclaim and negate all other warranties including, 
                without limitation, implied warranties or conditions of merchantability, fitness for a 
                particular purpose, or non-infringement of intellectual property.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Limitations</h2>
              <p className="text-muted-foreground">
                In no event shall Midweave or its suppliers be liable for any damages (including, 
                without limitation, damages for loss of data or profit, or due to business interruption) 
                arising out of the use or inability to use Midweave.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Revisions</h2>
              <p className="text-muted-foreground">
                We may revise these terms of service at any time without notice. By using Midweave, 
                you agree to be bound by the current version of these terms of service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Contact</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@midweave.com" className="text-primary hover:underline">
                  legal@midweave.com
                </a>
              </p>
            </section>
          </div>
        </div>
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