"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputWithError } from "@/components/ui/input-with-error"
import { TextareaWithError } from "@/components/ui/textarea-with-error"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, X, Loader2, Sparkles, Plus, Minus } from "lucide-react"
import { validateImageFile, validateMidjourneyParameters } from "@/lib/utils/validation"
import { uploadImages, saveEntry } from "@/lib/services/storage"
import { analyzeImage } from "@/lib/services/ai-analysis"
import { AIAnalysis } from "@/lib/types/schema"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getRoute } from "@/lib/utils"

// Type definitions for array fields
type StyleFields = 'secondary' | 'influences';
type ColorFields = 'palette' | 'mood' | 'contrast';
type TagFields = 'style' | 'technical' | 'mood';
type TechnicalFields = 'quality' | 'renderStyle' | 'detailLevel' | 'lighting';

type CategoryConfig = {
  style: { fields: StyleFields[] };
  colors: { fields: ColorFields[] };
  tags: { fields: TagFields[] };
};

const CATEGORY_CONFIG: CategoryConfig = {
  style: { fields: ['secondary', 'influences'] },
  colors: { fields: ['palette', 'mood', 'contrast'] },
  tags: { fields: ['style', 'technical', 'mood'] }
};

const TECHNICAL_FIELDS: TechnicalFields[] = ['quality', 'renderStyle', 'detailLevel', 'lighting'];

type FormPath = 
  | `aiAnalysis.style.${StyleFields}`
  | `aiAnalysis.colors.${ColorFields}`
  | `aiAnalysis.tags.${TagFields}`
  | `aiAnalysis.technical.${TechnicalFields}`
  | `aiAnalysis.style.primary`
  | 'aiAnalysis.description'
  | 'aiAnalysis.imageType';

interface FormValues {
  sref: string;
  prompt?: string;
  style?: string;
  ar?: string;
  chaos?: number;
  no?: string;
  niji?: boolean;
  version?: string;
  tile?: boolean;
  quality?: number;
  stylize?: number;
  aiAnalysis?: AIAnalysis;
}

export function UploadForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, AIAnalysis>>({})
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormValues>()

  // Helper function to safely get array values
  const getArrayValues = (category: keyof CategoryConfig, field: string): string[] => {
    const analysis = watch('aiAnalysis');
    if (!analysis?.[category]) return [];
    
    const value = analysis[category][field as keyof typeof analysis[typeof category]];
    return Array.isArray(value) ? value : [];
  };

  // Helper function to update array fields
  const handleArrayFieldUpdate = (
    category: keyof CategoryConfig,
    field: string,
    index: number,
    value: string
  ) => {
    const analysis = watch('aiAnalysis');
    if (!analysis?.[category]) return;

    const currentArray = getArrayValues(category, field);
    const newArray = [...currentArray];
    newArray[index] = value;

    setValue(`aiAnalysis.${category}.${field}` as FormPath, newArray as any, {
      shouldValidate: true
    });
  };

  // Helper function to add new array item
  const handleAddArrayItem = (
    category: keyof CategoryConfig,
    field: string
  ) => {
    const analysis = watch('aiAnalysis');
    if (!analysis?.[category]) return;

    const currentArray = getArrayValues(category, field);
    const newArray = [...currentArray, ''];

    setValue(`aiAnalysis.${category}.${field}` as FormPath, newArray as any, {
      shouldValidate: true
    });
  };

  // Helper function to remove array item
  const handleRemoveArrayItem = (
    category: keyof CategoryConfig,
    field: string,
    index: number
  ) => {
    const analysis = watch('aiAnalysis');
    if (!analysis?.[category]) return;

    const currentArray = getArrayValues(category, field);
    const newArray = currentArray.filter((_, i) => i !== index);

    setValue(`aiAnalysis.${category}.${field}` as FormPath, newArray as any, {
      shouldValidate: true
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Validate each file
      const validFiles = files.filter(file => {
        const validationResult = validateImageFile(file)
        if (validationResult !== true) {
          toast({
            title: "Invalid file",
            description: `${file.name}: ${validationResult}`
          })
          return false
        }
        return true
      })

      if (validFiles.length + selectedFiles.length > 4) {
        toast({
          title: "Too many files",
          description: "You can only upload up to 4 images at once"
        })
        return
      }

      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setPreviews(prev => prev.filter((_, i) => i !== index))
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleAIAnalysis = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to analyze"
      })
      return
    }

    setIsAnalyzing(true)
    setShowAIDialog(true)

    try {
      const analysisResults: Record<number, AIAnalysis> = {}
      
      // Analyze each image
      for (let i = 0; i < selectedFiles.length; i++) {
        try {
          const analysis = await analyzeImage(selectedFiles[i])
          analysisResults[i] = analysis
        } catch (error) {
          console.error(`Error analyzing image ${i}:`, error)
          toast({
            title: `Error analyzing image ${i + 1}`,
            description: "Failed to analyze image. Please try again.",
            variant: "destructive"
          })
        }
      }

      setAiAnalysis(analysisResults)
      
      // Set the form values with the first image's analysis
      if (analysisResults[0]) {
        setValue('aiAnalysis', analysisResults[0])
      }
      
      toast({
        title: "Analysis Complete",
        description: "AI analysis has been completed successfully!"
      })

      // Automatically close the dialog after analysis is complete
      setShowAIDialog(false)
    } catch (error) {
      console.error('AI Analysis error:', error)
      toast({
        title: "Analysis Failed",
        description: "Failed to complete AI analysis. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images
      const uploadedImages = await uploadImages(selectedFiles)
      
      // Create entry with AI analysis
      const entry = {
        title: data.prompt || "Untitled Style",
        images: uploadedImages.map((url: string, index: number) => ({
          url,
          thumbnail: url,
          size: selectedFiles[index].size
        })),
        parameters: {
          sref: data.sref,
          prompt: data.prompt || '',
          style: data.style,
          ar: data.ar,
          chaos: data.chaos,
          no: data.no?.split(',').map(s => s.trim()),
          niji: data.niji,
          version: data.version,
          tile: data.tile,
          quality: data.quality,
          stylize: data.stylize
        },
        aiAnalysis: {
          ...Object.values(aiAnalysis)[0],
          description: Object.values(aiAnalysis)[0]?.description || 'No description available'
        }
      }

      await saveEntry(entry)

      toast({
        title: "Success",
        description: "Style uploaded successfully"
      })

      // Reset form
      reset()
      setSelectedFiles([])
      setPreviews([])
      setAiAnalysis({})
      
      // Fix: Use correct route path
      router.push(getRoute('/admin'))
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload style",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Image Upload Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Label className="text-lg font-semibold">Images</Label>
            <Button
              type="button"
              size="lg"
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || selectedFiles.length === 0}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <Sparkles className="h-5 w-5" />
              {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Preview Cards */}
            {previews.map((preview, index) => (
              <Card key={preview} className="relative group">
                <CardContent className="p-2">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full aspect-square object-cover rounded-sm"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
        </div>
      </div>

      <Separator />

      {/* Midjourney Parameters Section */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Style Parameters</Label>
        
        {/* Primary Parameter: Style Reference */}
        <div className="space-y-2">
          <Label htmlFor="sref">Style Reference (--sref)</Label>
          <InputWithError 
            id="sref"
            placeholder="Enter style reference"
            className="font-mono"
            {...register("sref", {
              required: "Style reference is required",
              validate: validateMidjourneyParameters.sref
            })}
            error={errors.sref?.message}
          />
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt (Optional)</Label>
          <TextareaWithError 
            id="prompt"
            placeholder="Enter the full prompt used"
            className="font-mono min-h-[100px]"
            {...register("prompt", {
              validate: (value) => validateMidjourneyParameters.prompt(value)
            })}
            error={errors.prompt?.message}
          />
        </div>

        {/* Other Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style">Style (--style)</Label>
            <Input 
              id="style"
              placeholder="raw, expressive, etc."
              className="font-mono"
              {...register("style")}
            />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label htmlFor="ar">Aspect Ratio (--ar)</Label>
            <Input 
              id="ar"
              placeholder="16:9, 1:1, etc."
              className="font-mono"
              {...register("ar")}
            />
          </div>

          {/* Chaos */}
          <div className="space-y-2">
            <Label htmlFor="chaos">Chaos (--c)</Label>
            <InputWithError 
              id="chaos"
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
              className="font-mono"
              {...register("chaos", {
                valueAsNumber: true,
                validate: validateMidjourneyParameters.chaos
              })}
              error={errors.chaos?.message}
            />
          </div>

          {/* Version */}
          <div className="space-y-2">
            <Label htmlFor="version">Version (--v)</Label>
            <Input 
              id="version"
              placeholder="5, 5.1, 5.2, etc."
              className="font-mono"
              {...register("version")}
            />
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="quality">Quality (--q)</Label>
            <InputWithError 
              id="quality"
              type="number"
              step="0.25"
              min={0.25}
              max={2}
              placeholder="0.25-2"
              className="font-mono"
              {...register("quality", {
                valueAsNumber: true,
                validate: validateMidjourneyParameters.quality
              })}
              error={errors.quality?.message}
            />
          </div>

          {/* Stylize */}
          <div className="space-y-2">
            <Label htmlFor="stylize">Stylize (--s)</Label>
            <InputWithError 
              id="stylize"
              type="number"
              min={0}
              max={1000}
              placeholder="0-1000"
              className="font-mono"
              {...register("stylize", {
                valueAsNumber: true,
                validate: validateMidjourneyParameters.stylize
              })}
              error={errors.stylize?.message}
            />
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI Analysis</h3>
          <Button
            type="button"
            size="sm"
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || selectedFiles.length === 0}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </div>

        {watch('aiAnalysis') && (
          <div className="grid gap-6">
            {/* Description and Image Type Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <TextareaWithError
                    {...register('aiAnalysis.description')}
                    placeholder="Detailed description of the image"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image Type</Label>
                  <TextareaWithError
                    {...register('aiAnalysis.imageType')}
                    placeholder="Type of image (e.g., Photograph, Illustration, etc.)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style Analysis Card */}
            <Card>
              <CardHeader>
                <CardTitle>Style Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Style</Label>
                  <TextareaWithError
                    {...register('aiAnalysis.style.primary')}
                    placeholder="Primary style description"
                  />
                </div>

                {CATEGORY_CONFIG.style.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field}</Label>
                    {getArrayValues('style', field).map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={value}
                          onChange={(e) => handleArrayFieldUpdate('style', field, index, e.target.value)}
                          placeholder={`${field} value`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveArrayItem('style', field, index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddArrayItem('style', field)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {field}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Technical Analysis Card */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TECHNICAL_FIELDS.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <TextareaWithError
                      {...register(`aiAnalysis.technical.${field}` as FormPath)}
                      placeholder={`${field.replace(/([A-Z])/g, ' $1').trim()} description`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Colors Analysis Card */}
            <Card>
              <CardHeader>
                <CardTitle>Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Color Palette</Label>
                  <div className="flex gap-2 mb-2">
                    {getArrayValues('colors', 'palette').map((color, index) => (
                      <div key={index} className="flex-1 space-y-2">
                        <div
                          className="w-full h-8 rounded border"
                          style={{ backgroundColor: color }}
                        />
                        <Input
                          value={color}
                          onChange={(e) => handleArrayFieldUpdate('colors', 'palette', index, e.target.value)}
                          placeholder="#HEX"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveArrayItem('colors', 'palette', index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddArrayItem('colors', 'palette')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Color
                  </Button>
                </div>

                {['mood', 'contrast'].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field}</Label>
                    <TextareaWithError
                      {...register(`aiAnalysis.colors.${field}` as FormPath)}
                      placeholder={`${field} description`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {CATEGORY_CONFIG.tags.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field} Tags</Label>
                    {getArrayValues('tags', field).map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={tag}
                          onChange={(e) => handleArrayFieldUpdate('tags', field, index, e.target.value)}
                          placeholder={`${field} tag`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveArrayItem('tags', field, index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddArrayItem('tags', field)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          'Upload Style'
        )}
      </Button>

      {/* AI Analysis Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Analysis</DialogTitle>
            <DialogDescription>
              Analyzing your images to extract style information and generate tags.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">
                  Our AI is analyzing your images...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take a few moments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">
                  Click the Analyze button to start AI analysis. This will:
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                  <li>Generate a detailed description</li>
                  <li>Identify the image type</li>
                  <li>Detect color palettes and themes</li>
                  <li>Generate relevant style tags</li>
                  <li>Analyze composition and technical details</li>
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}