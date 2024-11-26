"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getRoute } from "@/lib/utils"
import { getAllEntries } from "@/lib/services/storage"
import { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2, Search } from "lucide-react"

export default function Home() {
  const [entries, setEntries] = useState<ImageEntryWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntry, setSelectedEntry] = useState<ImageEntryWithAnalysis | null>(null)

  useEffect(() => {
    loadEntries()
  }, [])

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

  const renderImageDetails = (entry: ImageEntryWithAnalysis) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Image Details</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Title:</span> {entry.title || 'Untitled'}
            </div>
            <div>
              <span className="font-medium">Description:</span> {entry.description || 'No description'}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(entry.adminMetadata.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Description:</span>{' '}
              {entry.aiAnalysis.description}
            </div>
            <div>
              <span className="font-medium">Style:</span>{' '}
              {entry.aiAnalysis.style.primary}
              {entry.aiAnalysis.style.secondary.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {' '}
                  ({entry.aiAnalysis.style.secondary.join(', ')})
                </span>
              )}
            </div>
            <div>
              <span className="font-medium">Technical:</span>{' '}
              {entry.aiAnalysis.technical.quality}, {entry.aiAnalysis.technical.renderStyle}
            </div>
            <div>
              <span className="font-medium">Tags:</span>{' '}
              <span className="text-sm">
                {[
                  ...entry.aiAnalysis.tags.style,
                  ...entry.aiAnalysis.tags.technical,
                  ...entry.aiAnalysis.tags.mood,
                ].join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Midjourney Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <span className="font-medium">Style Reference:</span>{' '}
              {entry.parameters.sref || 'None'}
            </div>
            <div>
              <span className="font-medium">Prompt:</span>{' '}
              {entry.parameters.prompt || 'None'}
            </div>
            <div>
              <span className="font-medium">Style:</span>{' '}
              {entry.parameters.style || 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Aspect Ratio:</span>{' '}
              {entry.parameters.ar || 'Default'}
            </div>
            <div>
              <span className="font-medium">Version:</span>{' '}
              {entry.parameters.version || 'Default'}
            </div>
            <div>
              <span className="font-medium">Quality:</span>{' '}
              {entry.parameters.quality || 'Default'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading gallery...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold">Midweave Gallery</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Curated Midjourney Style Library
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gallery..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link 
              href={getRoute('/admin')}
              className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <Card 
              key={entry.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="aspect-square relative">
                <img
                  src={entry.images[0].url}
                  alt={entry.aiAnalysis.description || 'Gallery image'}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.aiAnalysis.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog 
          open={selectedEntry !== null} 
          onOpenChange={(open) => !open && setSelectedEntry(null)}
        >
          <DialogContent className="max-w-4xl">
            {selectedEntry && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square relative">
                  <img
                    src={selectedEntry.images[0].url}
                    alt={selectedEntry.title || 'Gallery image'}
                    className="object-cover w-full h-full rounded-lg"
                  />
                </div>
                <div className="overflow-y-auto max-h-[600px] pr-4">
                  {renderImageDetails(selectedEntry)}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}