import { PARAMETER_LIMITS } from "../types/schema"

export const validateImageFile = (file: File) => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return 'File must be a JPEG, PNG, or WebP image'
  }

  if (file.size > maxSize) {
    return 'File size must be less than 5MB'
  }

  return true
}

export const validateMidjourneyParameters = {
  sref: (value: string) => {
    if (!value) return 'Style reference is required'
    return true
  },
  prompt: (value: string | undefined) => {
    if (!value) return true
    if (value.length < 10) return 'If provided, prompt must be at least 10 characters'
    return true
  },
  chaos: (value: number | undefined) => {
    if (value === undefined) return true
    if (value < PARAMETER_LIMITS.chaos.min || value > PARAMETER_LIMITS.chaos.max) {
      return `Must be between ${PARAMETER_LIMITS.chaos.min} and ${PARAMETER_LIMITS.chaos.max}`
    }
    return true
  },
  quality: (value: number | undefined) => {
    if (value === undefined) return true
    if (value < PARAMETER_LIMITS.quality.min || value > PARAMETER_LIMITS.quality.max) {
      return `Must be between ${PARAMETER_LIMITS.quality.min} and ${PARAMETER_LIMITS.quality.max}`
    }
    return true
  },
  stylize: (value: number | undefined) => {
    if (value === undefined) return true
    if (value < PARAMETER_LIMITS.stylize.min || value > PARAMETER_LIMITS.stylize.max) {
      return `Must be between ${PARAMETER_LIMITS.stylize.min} and ${PARAMETER_LIMITS.stylize.max}`
    }
    return true
  }
}