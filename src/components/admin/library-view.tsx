"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Search, Trash2, Edit, RefreshCw } from "lucide-react"
import type { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { getAllEntries, searchEntries, deleteEntry, deleteEntries, updateEntry, forceResyncAndClearCache } from "@/lib/services/storage"
import { useToast } from "@/hooks/use-toast"
import { TextareaWithError } from "@/components/ui/textarea-with-error"

export function LibraryView() {
  const [entries, setEntries] = useState<ImageEntryWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [selectedEntry, setSelectedEntry] = useState<ImageEntryWithAnalysis | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editedEntry, setEditedEntry] = useState<ImageEntryWithAnalysis | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const data = await getAllEntries()
      setEntries(data as ImageEntryWithAnalysis[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load entries",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query) {
      loadEntries()
      return
    }

    try {
      const results = await searchEntries(query)
      setEntries(results as ImageEntryWithAnalysis[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search entries",
        variant: "destructive"
      })
    }
  }

  const handleBatchDelete = async () => {
    try {
      const idsToDelete = Array.from(selectedEntries);
      await deleteEntries(idsToDelete);
      toast({
        title: "Success",
        description: `${idsToDelete.length} entries deleted successfully`
      });
      // Refresh the entries list
      loadEntries();
      // Clear selection
      setSelectedEntries(new Set());
    } catch (error) {
      console.error('Batch delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected entries",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({
        title: "Success",
        description: "Entry deleted successfully"
      });
      // Refresh the entries list
      loadEntries();
      // Clear selection if the deleted entry was selected
      if (selectedEntries.has(id)) {
        const newSelection = new Set(selectedEntries);
        newSelection.delete(id);
        setSelectedEntries(newSelection);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive"
      });
    }
  };

  const toggleEntrySelection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEntries(newSelected)
  }

  const toggleSelectAll = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)))
    }
  }

  const openPreviewModal = (entry: ImageEntryWithAnalysis) => {
    setSelectedEntry(entry)
    setEditedEntry(entry)
    setShowPreviewModal(true)
  }

  const handleUpdateEntry = async () => {
    if (!editedEntry?.id) return

    try {
      const updatedEntry: Partial<ImageEntryWithAnalysis> = {
        ...editedEntry,
        images: editedEntry.images.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail,
          size: img.size
        })),
        adminMetadata: {
          ...editedEntry.adminMetadata,
          lastModified: new Date().toISOString()
        }
      }

      await updateEntry(editedEntry.id, updatedEntry)
      toast({
        title: "Success",
        description: "Entry updated successfully"
      })
      setShowPreviewModal(false)
      loadEntries()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive"
      })
    }
  }

  const renderImageDetails = (entry: ImageEntryWithAnalysis) => {
    const aiAnalysis = entry.aiAnalysis || {
      description: entry.description || '',
      imageType: 'generated',
      style: {
        primary: '',
        secondary: [],
        influences: []
      },
      technical: {
        quality: '',
        renderStyle: '',
        detailLevel: '',
        lighting: ''
      },
      colors: {
        palette: [],
        mood: '',
        contrast: ''
      },
      tags: {
        style: [],
        technical: [],
        mood: []
      }
    };

    return (
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
                {aiAnalysis.description || 'No description'}
              </div>
              <div>
                <span className="font-medium">Image Type:</span>{' '}
                {aiAnalysis.imageType}
              </div>
              <div>
                <span className="font-medium">Style:</span>{' '}
                {aiAnalysis.style.primary || 'Not specified'}
                {aiAnalysis.style.secondary.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    ({aiAnalysis.style.secondary.join(', ')})
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Technical:</span>{' '}
                {[aiAnalysis.technical.quality, aiAnalysis.technical.renderStyle]
                  .filter(Boolean)
                  .join(', ') || 'Not specified'}
              </div>
              <div>
                <span className="font-medium">Tags:</span>{' '}
                <span className="text-sm">
                  {[
                    ...aiAnalysis.tags.style,
                    ...aiAnalysis.tags.technical,
                    ...aiAnalysis.tags.mood,
                  ].filter(Boolean).join(', ') || 'No tags'}
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
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search styles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {selectedEntries.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedEntries.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                setIsLoading(true);
                await forceResyncAndClearCache();
                await loadEntries();
                toast({
                  title: "Success",
                  description: "Library resynced successfully"
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to resync library",
                  variant: "destructive"
                });
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resync Library
          </Button>
        </div>
      </div>

      {/* Bulk Selection Header */}
      {entries.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedEntries.size === entries.length}
            onClick={toggleSelectAll}
          />
          <Label>{selectedEntries.size} selected</Label>
        </div>
      )}

      {/* Image Grid */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "No matching styles found" : "No styles uploaded yet"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {entries.map((entry) => (
            <Card 
              key={entry.id} 
              className="group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl"
              onClick={() => openPreviewModal(entry)}
            >
              <CardContent className="p-0">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={entry.id ? selectedEntries.has(entry.id) : false}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (entry.id) {
                        toggleEntrySelection(entry.id, event);
                      }
                    }}
                  />
                </div>

                {/* Main Image */}
                <div className="aspect-square">
                  <img
                    src={entry.images[0].url}
                    alt={entry.parameters.prompt || "Style preview"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Description Section */}
                <div className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {entry.aiAnalysis?.description || 'No AI analysis available'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {entry.parameters.style && (
                      <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">
                        {entry.parameters.style}
                      </span>
                    )}
                    {entry.aiAnalysis?.colors?.mood && (
                      <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">
                        {entry.aiAnalysis.colors.mood}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview/Edit Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
            <DialogDescription>
              View and edit image details, AI analysis, and Midjourney parameters
            </DialogDescription>
          </DialogHeader>
          
          {editedEntry && (
            <div className="grid grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={editedEntry.images[0].url}
                    alt={editedEntry.description || 'Style preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {editedEntry.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editedEntry.images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square rounded overflow-hidden">
                        <img
                          src={img.url}
                          alt={`Style variant ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-6 overflow-y-auto max-h-[70vh]">
                {/* Parameters Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Midjourney Parameters</h3>
                  <div>
                    <Label htmlFor="sref">Style Reference</Label>
                    <Input
                      id="sref"
                      value={editedEntry.parameters.sref}
                      onChange={(e) => setEditedEntry({
                        ...editedEntry,
                        parameters: {...editedEntry.parameters, sref: e.target.value}
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <TextareaWithError
                      id="prompt"
                      value={editedEntry.parameters.prompt || ""}
                      onChange={(e) => setEditedEntry({
                        ...editedEntry,
                        parameters: {...editedEntry.parameters, prompt: e.target.value}
                      })}
                    />
                  </div>
                </div>

                {editedEntry?.aiAnalysis && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">AI Analysis</h3>
                    
                    {/* Description */}
                    <div>
                      <Label>Description</Label>
                      <TextareaWithError
                        value={editedEntry.aiAnalysis.description || ''}
                        onChange={(e) => setEditedEntry({
                          ...editedEntry,
                          aiAnalysis: {
                            ...editedEntry.aiAnalysis!,
                            description: e.target.value
                          }
                        })}
                      />
                    </div>

                    {/* Style Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Style</h4>
                      
                      <div>
                        <Label>Primary Style</Label>
                        <Input
                          value={editedEntry.aiAnalysis.style.primary || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              style: {
                                ...editedEntry.aiAnalysis!.style,
                                primary: e.target.value
                              }
                            }
                          })}
                        />
                      </div>

                      <div>
                        <Label>Secondary Styles</Label>
                        <TextareaWithError
                          value={editedEntry.aiAnalysis.style.secondary.join(", ")}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              style: {
                                ...editedEntry.aiAnalysis!.style,
                                secondary: e.target.value.split(",").map(s => s.trim())
                              }
                            }
                          })}
                          placeholder="Enter styles separated by commas"
                        />
                      </div>

                      <div>
                        <Label>Influences</Label>
                        <TextareaWithError
                          value={editedEntry.aiAnalysis.style.influences.join(", ")}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              style: {
                                ...editedEntry.aiAnalysis!.style,
                                influences: e.target.value.split(",").map(s => s.trim())
                              }
                            }
                          })}
                          placeholder="Enter influences separated by commas"
                        />
                      </div>
                    </div>

                    {/* Technical Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Technical Details</h4>
                      
                      <div>
                        <Label>Quality</Label>
                        <Input
                          value={editedEntry.aiAnalysis.technical.quality || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              technical: {...editedEntry.aiAnalysis!.technical, quality: e.target.value}
                            }
                          })}
                        />
                      </div>

                      <div>
                        <Label>Render Style</Label>
                        <Input
                          value={editedEntry.aiAnalysis.technical.renderStyle || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              technical: {...editedEntry.aiAnalysis!.technical, renderStyle: e.target.value}
                            }
                          })}
                        />
                      </div>

                      <div>
                        <Label>Detail Level</Label>
                        <Input
                          value={editedEntry.aiAnalysis.technical.detailLevel || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              technical: {...editedEntry.aiAnalysis!.technical, detailLevel: e.target.value}
                            }
                          })}
                        />
                      </div>

                      <div>
                        <Label>Lighting</Label>
                        <Input
                          value={editedEntry.aiAnalysis.technical.lighting || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              technical: {...editedEntry.aiAnalysis!.technical, lighting: e.target.value}
                            }
                          })}
                        />
                      </div>
                    </div>

                    {/* Colors Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Colors</h4>
                      
                      <div>
                        <Label>Color Mood</Label>
                        <Input
                          value={editedEntry.aiAnalysis.colors.mood || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              colors: {...editedEntry.aiAnalysis!.colors, mood: e.target.value}
                            }
                          })}
                        />
                      </div>

                      <div>
                        <Label>Color Palette</Label>
                        <TextareaWithError
                          value={editedEntry.aiAnalysis.colors.palette.join(", ")}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              colors: {
                                ...editedEntry.aiAnalysis!.colors,
                                palette: e.target.value.split(",").map(s => s.trim())
                              }
                            }
                          })}
                          placeholder="Enter colors separated by commas"
                        />
                      </div>

                      <div>
                        <Label>Contrast</Label>
                        <Input
                          value={editedEntry.aiAnalysis.colors.contrast || ''}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              colors: {...editedEntry.aiAnalysis!.colors, contrast: e.target.value}
                            }
                          })}
                        />
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Tags</h4>
                      
                      <div>
                        <Label>Style</Label>
                        <TextareaWithError
                          value={editedEntry.aiAnalysis.tags.style.join(", ")}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              tags: {
                                ...editedEntry.aiAnalysis!.tags,
                                style: e.target.value.split(",").map(s => s.trim())
                              }
                            }
                          })}
                          placeholder="Enter styles separated by commas"
                        />
                      </div>

                      <div>
                        <Label>Technical</Label>
                        <TextareaWithError
                          value={editedEntry.aiAnalysis.tags.technical.join(", ")}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              tags: {
                                ...editedEntry.aiAnalysis!.tags,
                                technical: e.target.value.split(",").map(s => s.trim())
                              }
                            }
                          })}
                          placeholder="Enter technicals separated by commas"
                        />
                      </div>

                      <div>
                        <Label>Mood</Label>
                        <TextareaWithError
                          value={editedEntry.aiAnalysis.tags.mood.join(", ")}
                          onChange={(e) => setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: {
                              ...editedEntry.aiAnalysis!,
                              tags: {
                                ...editedEntry.aiAnalysis!.tags,
                                mood: e.target.value.split(",").map(s => s.trim())
                              }
                            }
                          })}
                          placeholder="Enter moods separated by commas"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateEntry}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 