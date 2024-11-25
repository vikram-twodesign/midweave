import { db } from '@/lib/db';
import type { ImageEntry } from '@/lib/db';
import { ImageEntryWithAnalysis, AIAnalysis } from '@/lib/types/schema';
import { GitHubService } from './github';

const github = new GitHubService();

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper function to convert database entry to API entry
const convertToApiEntry = (entry: ImageEntry & { id: number }): ImageEntryWithAnalysis => {
  const { id, createdAt, lastModified, featured, curatorNotes, ...rest } = entry;
  
  return {
    ...rest,
    id: id.toString(),
    adminMetadata: {
      createdAt: createdAt.toISOString(),
      lastModified: lastModified.toISOString(),
      featured: featured,
      curatorNotes: curatorNotes
    },
    parameters: {
      ...entry.parameters,
      prompt: entry.parameters.prompt || ''
    },
    aiAnalysis: entry.aiAnalysis as AIAnalysis
  };
};

// Initialize function to sync with GitHub
const initializeFromGitHub = async () => {
  try {
    console.log('Initializing from GitHub...');
    const entries = await github.listEntries();
    
    if (entries && entries.length > 0) {
      console.log(`Found ${entries.length} entries in GitHub`);
      
      // Convert dates from ISO strings to Date objects
      const processedEntries = entries.map(entry => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        lastModified: new Date(entry.lastModified)
      }));

      // Update local database
      await db.transaction('rw', db.entries, async () => {
        // Clear existing entries
        await db.entries.clear();
        // Add all entries from GitHub
        await db.entries.bulkAdd(processedEntries);
      });
      
      console.log('Local database synchronized with GitHub');
    } else {
      console.warn('No entries found in GitHub');
    }
  } catch (error) {
    console.error('Error initializing from GitHub:', error);
    throw new Error('Failed to sync with GitHub');
  }
};

// Force sync function
export const forceSyncWithGitHub = async (): Promise<void> => {
  await initializeFromGitHub();
};

// Upload images function
export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const urls = await Promise.all(
      files.map(async (file, index) => {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const path = `images/originals/${timestamp}_${safeName}`;
        
        return await github.uploadImage(file, path);
      })
    );
    return urls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error('Failed to upload images');
  }
};

export const saveEntry = async (entry: {
  title: string;
  description?: string;
  images: { url: string; thumbnail: string; size: number }[];
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
  aiAnalysis: AIAnalysis;
}): Promise<string> => {
  try {
    const newEntry: Omit<ImageEntry, 'id'> = {
      title: entry.title,
      description: entry.description || '',
      images: entry.images,
      parameters: entry.parameters,
      aiAnalysis: entry.aiAnalysis,
      createdAt: new Date(),
      lastModified: new Date(),
      featured: false,
      curatorNotes: ''
    };
    
    const id = await db.addEntry(newEntry);

    // Save metadata to GitHub
    await github.saveMetadata({
      id: id.toString(),
      ...newEntry,
      createdAt: newEntry.createdAt.toISOString(),
      lastModified: newEntry.lastModified.toISOString()
    }, `data/entries/${id}.json`);

    return id.toString();
  } catch (error) {
    console.error('Error saving entry:', error);
    throw new Error('Failed to save entry');
  }
};

export const getAllEntries = async (): Promise<ImageEntryWithAnalysis[]> => {
  try {
    // Always sync with GitHub first
    await initializeFromGitHub();
    
    const entries = await db.getAllEntries();
    return entries.map(entry => convertToApiEntry(entry as ImageEntry & { id: number }));
  } catch (error) {
    console.error('Error getting entries:', error);
    throw new Error('Failed to get entries');
  }
};

export const getFeaturedEntries = async (): Promise<ImageEntryWithAnalysis[]> => {
  try {
    // Make sure we're synced with GitHub
    const count = await db.entries.count();
    if (count === 0) {
      await initializeFromGitHub();
    }
    
    const entries = await db.getFeaturedEntries();
    return entries.map(entry => convertToApiEntry(entry as ImageEntry & { id: number }));
  } catch (error) {
    console.error('Error getting featured entries:', error);
    throw new Error('Failed to get featured entries');
  }
};

export const searchEntries = async (query: string): Promise<ImageEntryWithAnalysis[]> => {
  try {
    // Make sure we're synced with GitHub
    const count = await db.entries.count();
    if (count === 0) {
      await initializeFromGitHub();
    }
    
    const entries = await db.searchEntries(query);
    return entries.map(entry => convertToApiEntry(entry as ImageEntry & { id: number }));
  } catch (error) {
    console.error('Error searching entries:', error);
    throw new Error('Failed to search entries');
  }
};

export const exportData = async (entries?: ImageEntryWithAnalysis[]): Promise<string> => {
  try {
    const dataToExport = entries || await db.getAllEntries();
    return JSON.stringify(dataToExport, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
};

export const importData = async (jsonData: string): Promise<void> => {
  try {
    await db.importData(jsonData);
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data');
  }
};

export const deleteEntries = async (ids: number[]): Promise<void> => {
  try {
    await Promise.all(ids.map(id => db.deleteEntry(id)));
  } catch (error) {
    console.error('Error deleting entries:', error);
    throw new Error('Failed to delete entries');
  }
};

export const updateEntry = async (
  id: string,
  updates: Partial<Omit<ImageEntry, 'id' | 'createdAt'>> & { lastModified?: Date }
): Promise<string> => {
  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format');
    }
    
    const updatedEntry = {
      ...updates,
      lastModified: new Date()
    };
    
    await db.updateEntry(numericId, updatedEntry);

    // Update metadata in GitHub
    const entry = await db.entries.get(numericId);
    if (entry) {
      await github.saveMetadata({
        id: id,
        ...entry,
        ...updatedEntry,
        createdAt: entry.createdAt.toISOString(),
        lastModified: updatedEntry.lastModified.toISOString()
      }, `data/entries/${id}.json`);
    }

    return id;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw new Error('Failed to update entry');
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format');
    }

    // Delete from GitHub first
    try {
      await github.deleteFile(`data/entries/${id}.json`);
    } catch (error) {
      console.error('Error deleting file from GitHub:', error);
      // Continue with local deletion even if GitHub deletion fails
    }

    // Then delete from local database
    await db.deleteEntry(numericId);
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw new Error('Failed to delete entry');
  }
};