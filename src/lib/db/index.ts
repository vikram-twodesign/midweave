import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface ImageEntry {
  id?: number;
  title: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  featured: boolean;
  curatorNotes?: string;
  
  // Image data
  images: {
    url: string;
    thumbnail: string;
    size: number;
  }[];

  // Midjourney Parameters
  parameters: {
    sref: string;
    prompt: string;
    style?: string;
    ar?: string;
    chaos?: number;
    no?: string[];
    niji?: boolean;
    version?: string;
    tile?: boolean;
    weird?: number;
    stop?: number;
    quality?: number;
    stylize?: number;
    seed?: number;
  };

  // AI Analysis
  aiAnalysis?: {
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
  };
}

class MidweaveDB extends Dexie {
  entries!: Table<ImageEntry>;

  constructor() {
    super('midweave');
    
    // Define tables and indexes
    this.version(1).stores({
      entries: '++id, title, createdAt, lastModified, featured, [parameters.sref]'
    });
  }

  async addEntry(entry: Omit<ImageEntry, 'id'>): Promise<number> {
    return await this.entries.add(entry);
  }

  async updateEntry(id: number, updates: Partial<ImageEntry>): Promise<number> {
    await this.entries.update(id, updates);
    return id;
  }

  async deleteEntry(id: number): Promise<void> {
    await this.entries.delete(id);
  }

  async getAllEntries(): Promise<ImageEntry[]> {
    return await this.entries.orderBy('lastModified').reverse().toArray();
  }

  async getFeaturedEntries(): Promise<ImageEntry[]> {
    return await this.entries.filter(entry => entry.featured).toArray();
  }

  async searchEntries(query: string): Promise<ImageEntry[]> {
    const lowercaseQuery = query.toLowerCase();
    return await this.entries
      .filter(entry => {
        const matchesBasic = 
          entry.title.toLowerCase().includes(lowercaseQuery) ||
          entry.parameters.prompt?.toLowerCase().includes(lowercaseQuery);

        if (matchesBasic) return true;

        // Search in AI analysis fields
        if (entry.aiAnalysis) {
          const matchesAI = 
            entry.aiAnalysis.description?.toLowerCase().includes(lowercaseQuery) ||
            entry.aiAnalysis.imageType?.toLowerCase().includes(lowercaseQuery) ||
            entry.aiAnalysis.style.primary?.toLowerCase().includes(lowercaseQuery) ||
            entry.aiAnalysis.style.secondary?.some(s => s.toLowerCase().includes(lowercaseQuery)) ||
            entry.aiAnalysis.colors.mood?.toLowerCase().includes(lowercaseQuery) ||
            entry.aiAnalysis.tags.style?.some(t => t.toLowerCase().includes(lowercaseQuery)) ||
            entry.aiAnalysis.tags.technical?.some(t => t.toLowerCase().includes(lowercaseQuery)) ||
            entry.aiAnalysis.tags.mood?.some(t => t.toLowerCase().includes(lowercaseQuery));

          if (matchesAI) return true;
        }

        return false;
      })
      .toArray();
  }

  async exportData(): Promise<string> {
    const entries = await this.getAllEntries();
    return JSON.stringify(entries);
  }

  async importData(jsonData: string): Promise<void> {
    const entries = JSON.parse(jsonData) as ImageEntry[];
    await this.transaction('rw', this.entries, async () => {
      await this.entries.clear();
      await this.entries.bulkAdd(entries);
    });
  }
}

// Create and export a single instance
export const db = new MidweaveDB();

// Export type helper for components
export type { Table }; 