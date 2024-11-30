"use client"

import { useEffect, useState } from 'react';
import { ImageGrid } from '@/components/gallery/image-grid';
import { GitHubService } from '@/lib/services/github';
import type { ImageEntryWithAnalysis } from '@/lib/types/schema';
import { convertGitHubEntryToSchema } from '@/lib/services/storage';
import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';

const github = new GitHubService();

export default function HomePage() {
  const [entries, setEntries] = useState<ImageEntryWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const githubEntries = await github.listEntries();
        const processedEntries = githubEntries
          .filter(entry => entry !== null)
          .map(entry => convertGitHubEntryToSchema(entry));
        setEntries(processedEntries);
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header className="border-b" />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-[length:400%_400%] animate-gradient min-h-[600px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6,#8b5cf6,#d946ef,#3b82f6)] opacity-50 mix-blend-soft-light animate-gradient-slow" />
          
          <div className="container mx-auto px-4 py-32 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center space-y-8"
            >
              <h1 className="text-5xl font-bold text-white drop-shadow-md leading-tight">
                Welcome to Midweave
              </h1>
              <p className="text-xl text-white/90 drop-shadow leading-relaxed max-w-2xl mx-auto">
                A carefully curated collection of exceptional Midjourney styles and their parameters. Each image in our library has been hand-picked and analyzed to help you discover the perfect parameters for your next creation.
              </p>
              <p className="text-xl text-white/90 drop-shadow leading-relaxed max-w-2xl mx-auto">
                Browse, search, and instantly copy any style settings that catch your eye—it's like a recipe book for Midjourney magic.
              </p>
              <div className="flex gap-4 justify-center mt-8">
                <Link 
                  href="/submit" 
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Submit Your Art
                </Link>
                <Link 
                  href="#gallery" 
                  className="bg-blue-600/20 text-white border border-white/30 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600/30 transition-colors"
                >
                  Explore Gallery
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div id="gallery" className="container mx-auto p-4">
          <h2 className="text-3xl font-bold mb-8">Style Gallery</h2>
          <ImageGrid entries={entries} isLoading={loading} />
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
  );
}