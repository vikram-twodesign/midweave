"use client"

import { useState } from "react"
import { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ImageGridProps {
  entries: ImageEntryWithAnalysis[]
  isLoading: boolean
}

export function ImageGrid({ entries, isLoading }: ImageGridProps) {
  const [selectedEntry, setSelectedEntry] = useState<ImageEntryWithAnalysis | null>(null)

  const renderImageDetails = (entry: ImageEntryWithAnalysis) => (
    <div className="space-y-4">
      <div className="aspect-[3/2] relative mb-4">
        <img
          src={entry.images[0]?.url}
          alt={entry.aiAnalysis.description}
          className="object-contain w-full h-full rounded-lg"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Image Details</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Description:</span>{' '}
              {entry.aiAnalysis.description}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-80 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">No images found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <Card 
            key={entry.id} 
            className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => setSelectedEntry(entry)}
          >
            <div className="relative aspect-[3/2]">
              <img
                src={entry.images[0]?.thumbnail || entry.images[0]?.url}
                alt={entry.aiAnalysis.description}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {entry.aiAnalysis.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && renderImageDetails(selectedEntry)}
        </DialogContent>
      </Dialog>
    </>
  )
} 