import { db } from '@/lib/db';
import { GitHubService } from '@/lib/services/github';
import type { 
  ImageEntry as SchemaImageEntry, 
  ImageEntryWithAnalysis, 
  AIAnalysis
} from '@/lib/types/schema';
import { ImageEntry as DBImageEntry } from '@/lib/db';

interface GitHubEntry {
  id: string;
  title: string;
  description: string;
  images: Array<{
    url: string;
    thumbnail?: string;
    size?: number;
  }>;
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
    quality?: number;
    stylize?: number;
  };
  adminMetadata: {
    createdAt: string;
    lastModified: string;
    featured: boolean;
    curatorNotes?: string;
  };
  aiAnalysis?: AIAnalysis;
}

const github = new GitHubService();

const defaultAIAnalysis: AIAnalysis = {
  description: '',
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
const convertToApiEntry = (entry: DBImageEntry & { id: number }): ImageEntryWithAnalysis => {
  const id = String(entry.id);
  return {
    id,
    title: entry.title,
    description: entry.description,
    images: entry.images,
    parameters: entry.parameters,
    adminMetadata: {
      createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : String(entry.createdAt),
      lastModified: entry.lastModified instanceof Date ? entry.lastModified.toISOString() : String(entry.lastModified),
      featured: entry.featured,
      curatorNotes: entry.curatorNotes || ''
    },
    aiAnalysis: entry.aiAnalysis || {
      ...defaultAIAnalysis,
      description: entry.description || ''
    }
  };
};

// Convert schema entry to DB entry
const convertToDBEntry = (entry: {
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
    quality?: number;
    stylize?: number;
  };
  aiAnalysis?: AIAnalysis;
  adminMetadata?: {
    createdAt: string;
    lastModified: string;
    featured: boolean;
    curatorNotes?: string;
  };
}): Omit<DBImageEntry, 'id'> => {
  const now = new Date();
  return {
    title: entry.title,
    description: entry.description,
    createdAt: now,
    lastModified: now,
    featured: entry.adminMetadata?.featured || false,
    curatorNotes: entry.adminMetadata?.curatorNotes || '',
    images: entry.images,
    parameters: entry.parameters,
    aiAnalysis: entry.aiAnalysis || {
      ...defaultAIAnalysis,
      description: entry.description || ''
    }
  };
};

// Initialize function to sync with GitHub
export async function initializeFromGitHub(): Promise<void> {
  try {
    const entries = await github.listEntries() as GitHubEntry[];
    console.log(`Found ${entries.length} entries in GitHub`);
    
    await db.transaction('rw', db.entries, async () => {
      await db.entries.clear();
      
      for (const entry of entries) {
        if (!entry) continue;
        
        // Ensure image URLs are properly formatted
        const processedImages = entry.images.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail || img.url,
          size: img.size || 0
        }));
        
        const processedEntry: Omit<DBImageEntry, 'id'> = {
          title: entry.title || '',
          description: entry.description || '',
          createdAt: new Date(entry.adminMetadata?.createdAt || Date.now()),
          lastModified: new Date(entry.adminMetadata?.lastModified || Date.now()),
          featured: entry.adminMetadata?.featured || false,
          curatorNotes: entry.adminMetadata?.curatorNotes || '',
          images: processedImages,
          parameters: entry.parameters,
          aiAnalysis: entry.aiAnalysis || defaultAIAnalysis
        };
        
        await db.entries.add(processedEntry);
      }
    });
    
    console.log('Local database synchronized with GitHub');
  } catch (error) {
    console.error('Error initializing from GitHub:', error);
    throw new Error('Failed to sync with GitHub');
  }
}

// Force sync function
export const forceSyncWithGitHub = async (): Promise<void> => {
  await initializeFromGitHub();
};

// Upload images function
export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toUpperCase();
      const path = `data/images/originals/${timestamp}_${safeFileName}`;
      
      try {
        return await github.uploadImage(file, path);
      } catch (error) {
        console.error(`Error uploading file ${safeFileName}:`, error);
        throw error;
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      console.error(`Failed to upload ${failures.length} out of ${files.length} files`);
      throw new Error('Some files failed to upload');
    }

    return results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error('Failed to upload images');
  }
};

// Helper function to convert ImageEntryWithAnalysis to Record<string, unknown>
const convertToRecord = (entry: ImageEntryWithAnalysis): Record<string, unknown> => {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    images: entry.images,
    parameters: entry.parameters,
    adminMetadata: entry.adminMetadata,
    aiAnalysis: entry.aiAnalysis
  };
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
    quality?: number;
    stylize?: number;
  };
  aiAnalysis: AIAnalysis;
}): Promise<string> => {
  try {
    const dbEntry = convertToDBEntry({
      ...entry,
      adminMetadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        featured: false,
        curatorNotes: ''
      }
    });
    
    const id = await db.entries.add(dbEntry);
    if (typeof id !== 'number') throw new Error('Invalid ID returned from database');
    
    const apiEntry = convertToApiEntry({ ...dbEntry, id });
    await github.saveMetadata(convertToRecord(apiEntry), `data/entries/${id}.json`);
    
    return id.toString();
  } catch (error) {
    console.error('Error saving entry:', error);
    throw new Error('Failed to save entry');
  }
};

export const getAllEntries = async (): Promise<ImageEntryWithAnalysis[]> => {
  try {
    const count = await db.entries.count();
    if (count === 0) {
      await initializeFromGitHub();
    }
    
    const entries = await db.entries.toArray();
    return entries.map(entry => {
      if (!entry.id) throw new Error('Entry missing ID');
      
      // Ensure image URLs are properly formatted
      const processedImages = entry.images.map(img => ({
        url: img.url,
        thumbnail: img.thumbnail || img.url,
        size: img.size || 0
      }));
      
      return convertToApiEntry({
        ...entry,
        images: processedImages,
        id: entry.id
      });
    });
  } catch (error) {
    console.error('Error getting all entries:', error);
    throw new Error('Failed to get entries');
  }
};

export const getFeaturedEntries = async (): Promise<ImageEntryWithAnalysis[]> => {
  try {
    const count = await db.entries.count();
    if (count === 0) {
      await initializeFromGitHub();
    }
    
    const entries = await db.entries.where('featured').equals(1).toArray();
    return entries.map(entry => {
      if (!entry.id) throw new Error('Entry missing ID');
      return convertToApiEntry({ ...entry, id: entry.id });
    });
  } catch (error) {
    console.error('Error getting featured entries:', error);
    throw new Error('Failed to get featured entries');
  }
};

export const searchEntries = async (query: string): Promise<ImageEntryWithAnalysis[]> => {
  try {
    const count = await db.entries.count();
    if (count === 0) {
      await initializeFromGitHub();
    }
    
    const entries = await db.entries
      .filter(entry => 
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        (entry.description || '').toLowerCase().includes(query.toLowerCase()) ||
        entry.parameters.prompt.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
    
    return entries.map(entry => {
      if (!entry.id) throw new Error('Entry missing ID');
      return convertToApiEntry({ ...entry, id: entry.id });
    });
  } catch (error) {
    console.error('Error searching entries:', error);
    throw new Error('Failed to search entries');
  }
};

export const deleteEntries = async (ids: string[]): Promise<void> => {
  console.log('Starting batch deletion:', { count: ids.length, ids });
  
  const errors: Array<{ id: string; error: string }> = [];
  
  for (const id of ids) {
    try {
      await deleteEntry(id);
      console.log('Successfully deleted entry:', { id });
    } catch (error) {
      console.error(`Error deleting entry ${id}:`, error);
      errors.push({ 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  if (errors.length > 0) {
    console.error('Batch deletion completed with errors:', { errors });
    throw new Error(
      `Failed to delete some entries: ${JSON.stringify(errors, null, 2)}`
    );
  } else {
    console.log('Batch deletion completed successfully');
  }
};

export const updateEntry = async (
  id: string,
  updates: Partial<Omit<DBImageEntry, 'id' | 'createdAt'>>
): Promise<string> => {
  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format');
    }
    
    const currentEntry = await db.entries.get(numericId);
    if (!currentEntry) {
      throw new Error('Entry not found');
    }

    const updatedEntry: Omit<DBImageEntry, 'id'> = {
      ...currentEntry,
      ...updates,
      lastModified: new Date()
    };
    delete (updatedEntry as any).id;
    
    await db.entries.update(numericId, updatedEntry);
    const apiEntry = convertToApiEntry({ ...updatedEntry, id: numericId });
    
    // Convert to GitHub entry object
    const githubEntry = {
      ...apiEntry,
      adminMetadata: {
        ...apiEntry.adminMetadata,
        lastModified: new Date().toISOString()
      }
    } as Record<string, unknown>;
    
    await github.saveMetadata(githubEntry, `data/entries/${id}.json`);
    
    return id;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw new Error('Failed to update entry');
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  console.log('Starting entry deletion in storage service:', { id });
  
  try {
    // Delete from GitHub first
    await github.deleteEntry(id);
    console.log('GitHub deletion completed for entry:', { id });
    
    // Then delete from local database
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      await db.entries.delete(numericId);
      console.log('Local database deletion completed for entry:', { id });
    } else {
      throw new Error(`Invalid entry ID format: ${id}`);
    }
  } catch (error) {
    console.error('Error in storage service deleteEntry:', error);
    // Rethrow with more context
    throw new Error(
      `Failed to delete entry ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const add = async (entry: SchemaImageEntry): Promise<ImageEntryWithAnalysis> => {
  const dbEntry = convertToDBEntry(entry);
  const id = await db.entries.add(dbEntry);
  
  return convertToApiEntry({ ...dbEntry, id });
};

// Force resync and clear cache
export async function forceResyncAndClearCache(): Promise<void> {
  try {
    // Clear IndexedDB
    await db.delete();
    await db.open();
    
    // Reinitialize from GitHub
    await initializeFromGitHub();
    
    console.log('Force resync completed successfully');
  } catch (error) {
    console.error('Error during force resync:', error);
    throw new Error('Failed to force resync');
  }
}

export const createEntry = async (entry: SchemaImageEntry): Promise<ImageEntryWithAnalysis> => {
  let createdId: number | undefined;
  
  try {
    console.log('Creating new entry:', { title: entry.title });
    
    const newEntry = convertToDBEntry(entry);
    createdId = await db.entries.add(newEntry);
    
    if (!createdId) {
      throw new Error('Failed to create entry: No ID returned from database');
    }
    
    console.log('Entry added to local database:', { id: createdId });

    // Prepare GitHub entry
    const githubEntry: Record<string, any> = {
      id: createdId.toString(),
      title: newEntry.title,
      description: newEntry.description || '',
      images: newEntry.images,
      parameters: newEntry.parameters,
      adminMetadata: {
        createdAt: newEntry.createdAt.toISOString(),
        lastModified: newEntry.lastModified.toISOString(),
        featured: newEntry.featured,
        curatorNotes: newEntry.curatorNotes || ''
      },
      aiAnalysis: newEntry.aiAnalysis || defaultAIAnalysis
    };

    // Save to GitHub
    console.log('Saving entry to GitHub:', { id: createdId });
    await github.saveMetadata(githubEntry, `data/entries/${createdId}.json`);
    console.log('Entry saved to GitHub successfully:', { id: createdId });

    return convertToApiEntry({ ...newEntry, id: createdId });
  } catch (error) {
    console.error('Error creating entry:', error);
    // If GitHub save fails, delete from local database to maintain consistency
    if (typeof createdId === 'number') {
      try {
        await db.entries.delete(createdId);
        console.log('Rolled back local database entry:', { id: createdId });
      } catch (rollbackError) {
        console.error('Error rolling back database entry:', rollbackError);
      }
    }
    throw new Error(`Failed to create entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};