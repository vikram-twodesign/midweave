"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SubmitPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: "Success",
      description: "Your submission has been received. We'll review it soon!"
    })
    
    setIsSubmitting(false)
    setSelectedFiles([])
    setPreviews([])
    
    // Reset form
    const form = e.target as HTMLFormElement
    form.reset()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Submit Your Style</CardTitle>
            <CardDescription>
              Share your best Midjourney creations with the community. We'll review your submission and add it to our curated collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" required placeholder="Enter your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" required placeholder="Enter your email" />
                </div>
              </div>

              {/* Style Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Style Title</Label>
                  <Input id="title" required placeholder="Give your style a name" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    required 
                    placeholder="Describe your style and what makes it unique"
                  />
                </div>
                <div>
                  <Label htmlFor="prompt">Midjourney Prompt</Label>
                  <Textarea 
                    id="prompt" 
                    required 
                    placeholder="Share the exact prompt you used"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Style Images</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Preview Cards */}
                  {previews.map((preview, index) => (
                    <Card key={preview} className="relative group">
                      <CardContent className="p-2">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full aspect-square object-cover rounded-sm"
                        />
                      </CardContent>
                    </Card>
                  ))}

                  {/* Upload Button */}
                  {previews.length < 4 && (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-2">
                        <Label 
                          htmlFor="image-upload" 
                          className="flex flex-col items-center justify-center w-full aspect-square cursor-pointer"
                        >
                          <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
                          <span className="text-sm text-gray-500">Add Image</span>
                          <Input 
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isSubmitting}
                          />
                        </Label>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload up to 4 images of your style. Include variations to show its versatility.
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || selectedFiles.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Style'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 