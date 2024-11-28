"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ImageEntryWithAnalysis } from "@/lib/types/schema"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageSlideshowProps {
  entries: ImageEntryWithAnalysis[]
  interval?: number
  showNavigation?: boolean
  showCaption?: boolean
  className?: string
}

export function ImageSlideshow({ 
  entries, 
  interval = 5000,
  showNavigation = true,
  showCaption = true,
  className = ""
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying || entries.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % entries.length)
    }, interval)

    return () => clearInterval(timer)
  }, [entries.length, interval, isAutoPlaying])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((current) => (current - 1 + entries.length) % entries.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((current) => (current + 1) % entries.length)
  }

  if (!entries.length) {
    return null
  }

  return (
    <div className={`relative w-full aspect-[16/10] rounded-lg overflow-hidden shadow-xl ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={entries[currentIndex].images[0].url}
          alt={entries[currentIndex].aiAnalysis.description || "Gallery image"}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Navigation Buttons */}
      {showNavigation && (
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Image Caption */}
      {showCaption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-sm line-clamp-2">
            {entries[currentIndex].aiAnalysis.description}
          </p>
        </div>
      )}
    </div>
  )
} 