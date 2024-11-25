"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Search, Trash2, Edit } from "lucide-react"
import type { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { getAllEntries, searchEntries, deleteEntry, deleteEntries, updateEntry } from "@/lib/services/storage"
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
    if (selectedEntries.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedEntries.size} selected items?`
    )

    if (!confirmed) return

    try {
      await deleteEntries(Array.from(selectedEntries).map(id => parseInt(id)))
      toast({
        title: "Success",
        description: `${selectedEntries.size} items deleted successfully`
      })
      setSelectedEntries(new Set())
      loadEntries()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected items",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?")
    if (!confirmed) return

    try {
      await deleteEntry(id)
      toast({
        title: "Success",
        description: "Item deleted successfully"
      })
      loadEntries()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      })
    }
  }

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
              className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
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
                    alt={entry.title}
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

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-white">
                  <div className="space-y-2">
                    <h3 className="font-semibold truncate">{entry.title}</h3>
                    <p className="text-sm opacity-80 line-clamp-2">
                      {entry.parameters.prompt || "No prompt provided"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs opacity-80">
                      <Label>Style Reference:</Label>
                      <div className="font-mono truncate">{entry.parameters.sref}</div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreviewModal(entry);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          entry.id && handleDelete(entry.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            <DialogTitle>Edit Style</DialogTitle>
            <DialogDescription>
              Update style details and AI analysis
            </DialogDescription>
          </DialogHeader>
          
          {editedEntry && (
            <div className="grid grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={editedEntry.images[0].url}
                    alt={editedEntry.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {editedEntry.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editedEntry.images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square rounded overflow-hidden">
                        <img
                          src={img.url}
                          alt={`Variant ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-6 overflow-y-auto max-h-[70vh]">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editedEntry.title}
                    onChange={(e) => setEditedEntry({...editedEntry, title: e.target.value})}
                  />
                </div>

                {/* Parameters Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Midjourney Parameters</h3>
                  <div>
                    <Label>Style Reference</Label>
                    <Input
                      value={editedEntry.parameters.sref}
                      onChange={(e) => setEditedEntry({
                        ...editedEntry,
                        parameters: {...editedEntry.parameters, sref: e.target.value}
                      })}
                    />
                  </div>

                  <div>
                    <Label>Prompt</Label>
                    <TextareaWithError
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
                    
                    {/* Basic Info */}
                    <div>
                      <Label>Style</Label>
                      <Input
                        value={editedEntry.parameters.style || ''}
                        onChange={(e) => setEditedEntry({
                          ...editedEntry,
                          parameters: {
                            ...editedEntry.parameters,
                            style: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <TextareaWithError
                        value={editedEntry.description || ''}
                        onChange={(e) => setEditedEntry({
                          ...editedEntry,
                          description: e.target.value
                        })}
                      />
                    </div>

                    {/* Style Section */}
                    <div className="space-y-2">
                      <Label>Primary Style</Label>
                      <Input
                        value={editedEntry.aiAnalysis.style.primary}
                        onChange={(e) => {
                          const newAiAnalysis = {
                            ...editedEntry.aiAnalysis!,
                            style: {
                              ...editedEntry.aiAnalysis!.style,
                              primary: e.target.value
                            }
                          }
                          setEditedEntry({
                            ...editedEntry,
                            aiAnalysis: newAiAnalysis
                          })
                        }}
                      />

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

                    {/* Technical Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Technical Details</h4>
                      
                      <div>
                        <Label>Quality</Label>
                        <Input
                          value={editedEntry.aiAnalysis.technical.quality}
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
                          value={editedEntry.aiAnalysis.technical.renderStyle}
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
                          value={editedEntry.aiAnalysis.technical.detailLevel}
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
                          value={editedEntry.aiAnalysis.technical.lighting}
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
                          value={editedEntry.aiAnalysis.colors.mood}
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
                          value={editedEntry.aiAnalysis.colors.contrast}
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