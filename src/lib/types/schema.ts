export interface ImageEntry {
  id: string;
  title: string;
  description?: string;
  
  // Image data
  images: {
    url: string;
    thumbnail: string;
    size: number;
  }[];

  // Midjourney Parameters
  parameters: {
    sref: string;  // Style reference (primary parameter)
    prompt: string;  // Original prompt text
    style?: string;  // Style preset
    ar?: string;  // Aspect ratio
    chaos?: number;  // Chaos value 0-100
    no?: string[];  // Negative prompts
    niji?: boolean;  // Niji model
    version?: string;  // Model version
    tile?: boolean;  // Tile mode
    weird?: number;  // Weird value 0-3000
    stop?: number;  // Stop value 10-100
    quality?: number;  // Quality value 0.25-2
    stylize?: number;  // Stylize value 0-1000
    seed?: number;  // Seed value
  };

  // Metadata
  adminMetadata: {
    createdAt: string;
    lastModified: string;
    curatorNotes?: string;
    featured: boolean;
  };
}

export interface AIAnalysis {
  description: string;
  imageType: string;
  style: {
    primary: string;
    secondary: string[];
    influences: string[];
  };
  technical: {
    quality: string;
    renderStyle: string;
    detailLevel: string;
    lighting: string;
  };
  colors: {
    palette: string[];
    mood: string;
    contrast: string;
  };
  tags: {
    style: string[];
    technical: string[];
    mood: string[];
  };
}

// Combined type for entries with AI analysis
export interface ImageEntryWithAnalysis extends ImageEntry {
  aiAnalysis: AIAnalysis;
}

// Type for creating new entries
export type CreateImageEntry = Omit<ImageEntry, 'id' | 'adminMetadata'>;

// Utility type for parameter validation
export const PARAMETER_LIMITS = {
  chaos: { min: 0, max: 100 },
  weird: { min: 0, max: 3000 },
  stop: { min: 10, max: 100 },
  quality: { min: 0.25, max: 2 },
  stylize: { min: 0, max: 1000 },
} as const;