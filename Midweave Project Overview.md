# Midweave: Curated Midjourney Style Library

## Project Vision
Midweave is a carefully curated collection of exceptional Midjourney styles and their parameters. Each image in the library has been hand-picked and analyzed to help users discover the perfect parameters for their next creation. Browse, search, and instantly copy any style settings that catch your eye—it's like having an expert's recipe book for Midjourney magic.

## Design Philosophy
- Clean, gallery-like interface emphasizing visual discovery
- Minimal, purposeful interactions
- Focus on typography and spacing
- Smooth transitions and micro-interactions
- Responsive design that feels natural
- Rich admin tools for curation

## Technical Stack
- **Framework**: Next.js 14 (Static Export)
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Hosting**: GitHub Pages
- **Image Analysis**: OpenAI Vision API (client-side)
- **Storage**: GitHub Repository (images < 1MB)
- **Search**: Client-side implementation with Fuse.js
- **Authentication**: Simple password protection for admin

## Core Features

### 1. Public Interface
- Modern, minimum 3-column image grid
- Elegant hover effects showing parameters
- Advanced search and filter system
- Quick parameter copying
- Responsive design for all devices
- Clean, minimalist navigation

### 2. Admin Interface
- Secure, password-protected upload system
- Comprehensive parameter management
- Rich AI analysis tools
- Content organization capabilities
- Batch upload support (up to 4 images)
- Detailed editing interface

### 3. AI Analysis System
- Style analysis
- Color palette detection
- Composition analysis
- Technical detail assessment
- Automated tagging
- Manual override capabilities

### 4. Search & Discovery
- Style-based search
- Color palette filtering
- Tag-based discovery
- Parameter-specific filters
- Quick-copy functionality

## Technical Implementation

### Data Structure
```typescript
interface MidjourneyParameters {
  prompt: string;           // Original prompt text
  sref?: string;           // Style reference
  style?: string;          // Style preset
  ar?: string;             // Aspect ratio
  chaos?: string;          // Chaos value 0-100
  no?: string[];          // Negative prompts
  niji?: boolean;         // Niji model
  version?: string;       // Model version
  tile?: boolean;         // Tile mode
  weird?: number;         // Weird value 0-3000
  stop?: number;         // Stop value 10-100
  quality?: number;      // Quality value 0.25-2
  stylize?: number;      // Stylize value 0-1000
  seed?: number;         // Seed value
}

interface AIAnalysis {
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

interface ImageEntry {
  id: string;
  images: {
    url: string;
    thumbnail: string;
    size: number;
  }[];
  parameters: MidjourneyParameters;
  aiAnalysis: AIAnalysis;
  adminMetadata: {
    createdAt: string;
    lastModified: string;
    curatorNotes?: string;
    featured: boolean;
  };
}
```
