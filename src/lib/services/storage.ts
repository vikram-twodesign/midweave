import type { ImageEntry as SchemaImageEntry, ImageEntryWithAnalysis, CreateImageEntry, AIAnalysis } from '@/lib/types/schema';
import type { ImageEntry as DBImageEntry } from '@/lib/db';
import type { BatchFileUpdate, ImageUpload } from './github';
import { db } from '@/lib/db';
import { GitHubService } from './github';

const github = new GitHubService();

let resyncPromise: Promise<void> | null = null;

// Helper function to ensure complete image data
const ensureCompleteImageData = (images: Array<{ url: string; thumbnail?: string; size?: number }>): Array<{ url: string; thumbnail: string; size: number }> => {
  return images.map(img => ({
    url: img.url,
    thumbnail: img.thumbnail || img.url,
    size: img.size || 0
  }));
};

// Helper function to create default AI analysis
const createDefaultAIAnalysis = (description: string = ''): AIAnalysis => ({
  description,
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
});

// Helper function to validate parameters
const validateParameters = (parameters: unknown): parameters is SchemaImageEntry['parameters'] => {
  if (!parameters || typeof parameters !== 'object') return false;
  const p = parameters as any;
  return (
    typeof p.sref === 'string' &&
    typeof p.prompt === 'string' &&
    (!('chaos' in p) || typeof p.chaos === 'number') &&
    (!('quality' in p) || typeof p.quality === 'number') &&
    (!('stylize' in p) || typeof p.stylize === 'number') &&
    (!('no' in p) || Array.isArray(p.no))
  );
};

// Helper function to convert database entry to API entry
const convertToApiEntry = (entry: DBImageEntry & { id: number }): ImageEntryWithAnalysis => {
  const defaultAnalysis: AIAnalysis = {
    description: entry.description || '',
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

  return {
    id: String(entry.id),
    title: entry.title,
    description: entry.description || '',
    images: ensureCompleteImageData(entry.images),
    parameters: entry.parameters,
    adminMetadata: {
      createdAt: entry.createdAt.toISOString(),
      lastModified: entry.lastModified.toISOString(),
      featured: entry.featured,
      curatorNotes: entry.curatorNotes || ''
    },
    aiAnalysis: entry.aiAnalysis || defaultAnalysis
  };
};

// Type guard to check if entry has AI analysis
const hasAIAnalysis = (entry: any): entry is ImageEntryWithAnalysis => {
  return 'aiAnalysis' in entry && 
    entry.aiAnalysis && 
    typeof entry.aiAnalysis === 'object' &&
    'description' in entry.aiAnalysis &&
    'imageType' in entry.aiAnalysis &&
    'style' in entry.aiAnalysis &&
    'technical' in entry.aiAnalysis &&
    'colors' in entry.aiAnalysis &&
    'tags' in entry.aiAnalysis;
};

// Helper function to convert schema entry to database entry
const convertToDBEntry = (entry: CreateImageEntry | SchemaImageEntry, now: Date = new Date()): Omit<DBImageEntry, 'id'> => {
  let aiAnalysis: AIAnalysis | undefined = undefined;
  
  if (hasAIAnalysis(entry)) {
    aiAnalysis = {
      description: entry.aiAnalysis.description,
      imageType: entry.aiAnalysis.imageType,
      style: entry.aiAnalysis.style,
      technical: entry.aiAnalysis.technical,
      colors: entry.aiAnalysis.colors,
      tags: entry.aiAnalysis.tags
    };
  }

  return {
    title: entry.title,
    description: entry.description,
    images: ensureCompleteImageData(entry.images),
    parameters: entry.parameters,
    createdAt: now,
    lastModified: now,
    featured: false,
    curatorNotes: '',
    aiAnalysis
  };
};

// Helper function to ensure entry has an ID
const ensureEntryHasId = (entry: DBImageEntry): entry is DBImageEntry & { id: number } => {
  return typeof entry.id === 'number';
};

// Helper function to validate GitHub entry
const validateGitHubEntry = (entry: unknown): entry is SchemaImageEntry => {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as any;
  
  // Skip entries marked as deleted
  if (e.id && typeof e.id === 'string' && e.id.startsWith('.deleted-')) return false;

  try {
    return (
      typeof e.id === 'string' &&
      typeof e.title === 'string' &&
      Array.isArray(e.images) &&
      e.images.length > 0 &&
      e.images.every((img: any) => typeof img.url === 'string') &&
      typeof e.parameters === 'object' &&
      typeof e.parameters.sref === 'string' &&
      typeof e.parameters.prompt === 'string'
    );
  } catch (error) {
    console.warn('Entry validation failed:', error);
    return false;
  }
};

// Helper function to convert GitHub entry to schema entry
export const convertGitHubEntryToSchema = (entry: any): ImageEntryWithAnalysis => {
  // Create default AI analysis if none exists
  const defaultAIAnalysis: AIAnalysis = {
    description: entry.description || '',
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

  return {
    id: entry.id,
    title: entry.title,
    description: entry.description || '',
    images: ensureCompleteImageData(entry.images),
    parameters: {
      sref: entry.parameters.sref,
      prompt: entry.parameters.prompt,
      style: entry.parameters.style,
      ar: entry.parameters.ar,
      chaos: entry.parameters.chaos,
      no: Array.isArray(entry.parameters.no) ? entry.parameters.no : [],
      niji: entry.parameters.niji,
      version: entry.parameters.version,
      tile: entry.parameters.tile,
      quality: entry.parameters.quality,
      stylize: entry.parameters.stylize
    },
    adminMetadata: {
      createdAt: entry.adminMetadata?.createdAt || new Date().toISOString(),
      lastModified: entry.adminMetadata?.lastModified || new Date().toISOString(),
      featured: entry.adminMetadata?.featured || false,
      curatorNotes: entry.adminMetadata?.curatorNotes || ''
    },
    aiAnalysis: entry.aiAnalysis || defaultAIAnalysis
  };
};

// Type guard to check if object is a File or image data
type ImageFile = File | { url: string; thumbnail: string; size: number };

const isFile = (file: ImageFile): file is File => {
  return file instanceof File;
};

// Helper function to process files for upload
const processFiles = (files: ImageFile[]): ImageUpload[] => {
  return files.map(file => {
    if (isFile(file)) {
      return {
        file,
        path: `images/originals/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toUpperCase()}`
      };
    } else {
      return {
        file: {
          url: file.url,
          thumbnail: file.thumbnail,
          size: file.size
        },
        path: `images/originals/${Date.now()}_${file.url.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '_').toUpperCase() || 'IMAGE'}`
      };
    }
  });
};

export const resyncLibrary = async (): Promise<void> => {
  // If a resync is already in progress, return the existing promise
  if (resyncPromise) {
    return resyncPromise;
  }

  console.debug('Starting library resync...');
  
  resyncPromise = (async () => {
    try {
      // Get valid entries from GitHub
      const allEntries = await github.resyncLibrary();
      const validEntries = allEntries.filter(validateGitHubEntry);
      
      // Log validation results
      console.debug('Entry validation results:', {
        total: allEntries.length,
        valid: validEntries.length,
        invalid: allEntries.length - validEntries.length,
        invalidEntries: allEntries
          .filter(e => !validateGitHubEntry(e))
          .map(e => ({ id: (e as any).id }))
      });

      console.debug('Received valid entries from GitHub:', { count: validEntries.length });

      // Clear local database
      await db.entries.clear();
      console.debug('Cleared local database');

      // Add valid entries to local database
      let addedCount = 0;
      const errors: string[] = [];

      for (const entry of validEntries) {
        try {
          const numericId = parseInt(entry.id, 10);
          if (!isNaN(numericId)) {
            const now = new Date();
            // Convert GitHub entry to schema-compliant entry
            const schemaEntry = convertGitHubEntryToSchema(entry);
            const dbEntry = convertToDBEntry(schemaEntry, now);
            await db.entries.put({ ...dbEntry, id: numericId });
            addedCount++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to add entry ${entry.id}: ${errorMessage}`);
          console.warn(`Failed to add entry ${entry.id}:`, error);
        }
      }

      // Log results
      console.debug('Library resync completed:', {
        entriesProcessed: validEntries.length,
        entriesAdded: addedCount,
        errors: errors.length > 0 ? errors : undefined
      });

      // If no entries were added successfully, throw an error
      if (addedCount === 0) {
        throw new Error('Failed to add any entries during resync');
      }
    } catch (error) {
      console.error('Error during library resync:', error);
      throw new Error(
        `Failed to resync library: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      resyncPromise = null;
    }
  })();

  return resyncPromise;
};

export const getAllEntries = async (): Promise<ImageEntryWithAnalysis[]> => {
  try {
    const entries = await db.entries.toArray();
    return entries.filter(ensureEntryHasId).map(entry => convertToApiEntry(entry));
  } catch (error) {
    console.error('Error getting all entries:', error);
    throw new Error('Failed to get entries');
  }
};

export const searchEntries = async (query: string): Promise<ImageEntryWithAnalysis[]> => {
  try {
    const entries = await db.entries
      .filter(entry => 
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        (entry.description || '').toLowerCase().includes(query.toLowerCase()) ||
        entry.parameters.prompt.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
    
    return entries.filter(ensureEntryHasId).map(entry => convertToApiEntry(entry));
  } catch (error) {
    console.error('Error searching entries:', error);
    throw new Error('Failed to search entries');
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  console.log('Starting entry deletion:', { id });
  
  try {
    // Delete from GitHub first
    await github.deleteEntry(id);
    
    // Then delete from local database
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      await db.entries.delete(numericId);
    }

    // Clean up any .deleted- files that might exist
    try {
      await github.deleteFile(`data/entries/.deleted-${id}`);
    } catch (error) {
      // Ignore errors from cleanup - these files might not exist
      console.debug('Cleanup of .deleted file attempted:', error);
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw new Error(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteEntries = async (ids: string[]): Promise<void> => {
  console.log('Starting batch deletion:', { ids });
  
  try {
    // Delete from GitHub first
    await github.batchDeleteEntries(ids);
    
    // Then delete from local database
    for (const id of ids) {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        await db.entries.delete(numericId);
      }
      
      // Clean up any .deleted- files that might exist
      try {
        await github.deleteFile(`data/entries/.deleted-${id}`);
      } catch (error) {
        // Ignore errors from cleanup - these files might not exist
        console.debug('Cleanup of .deleted file attempted:', error);
      }
    }
  } catch (error) {
    console.error('Error in batch deletion:', error);
    throw new Error(`Failed to delete entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateEntry = async (
  id: string,
  updates: Partial<Omit<SchemaImageEntry, 'id' | 'adminMetadata'>>
): Promise<void> => {
  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID format');
    }
    
    const currentEntry = await db.entries.get(numericId);
    if (!currentEntry) {
      throw new Error('Entry not found');
    }

    const now = new Date();
    const updatedEntry = {
      ...currentEntry,
      ...convertToDBEntry(updates as CreateImageEntry, now),
      id: numericId,
      lastModified: now
    };
    
    await db.entries.put(updatedEntry);
    await github.saveMetadata(convertToApiEntry(updatedEntry), `data/entries/${id}.json`);
  } catch (error) {
    console.error('Error updating entry:', error);
    throw new Error(`Failed to update entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    console.debug('Starting image upload:', { count: files.length });
    
    // Process files and create image uploads
    const imageUploads = processFiles(files);
    
    // Upload images with metadata
    await github.uploadImagesWithMetadata(imageUploads);
    
    // Return the paths of the uploaded images
    const uploadedPaths = imageUploads.map(upload => upload.path);
    console.debug('All images uploaded successfully:', { count: uploadedPaths.length });
    return uploadedPaths;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error('Failed to upload images');
  }
};

export const saveEntry = async (entry: CreateImageEntry): Promise<string> => {
  try {
    const now = new Date();
    const dbEntry = convertToDBEntry(entry, now);
    
    const id = await db.entries.add(dbEntry);
    const fullEntry = convertToApiEntry({ ...dbEntry, id });

    // Create metadata update
    const metadataPath = `data/entries/${id}.json`;
    const metadataContent = Buffer.from(JSON.stringify(fullEntry, null, 2)).toString('base64');
    
    // Get raw files that need to be uploaded
    const rawFiles = entry.images
      .filter(img => img instanceof File) as File[];
    
    // Process files and create batch updates
    const imageUploads = processFiles(rawFiles);
    const batchUpdates: BatchFileUpdate[] = [];

    // Add metadata update
    batchUpdates.push({
      path: metadataPath,
      content: metadataContent,
      message: `Create entry ${id}`
    });

    // Add image updates
    for (const upload of imageUploads) {
      if (upload.file instanceof File) {
        const base64Content = await github.fileToBase64(upload.file);
        batchUpdates.push({
          path: upload.path,
          content: base64Content,
          message: `Upload image: ${upload.path.split('/').pop()}`
        });
      }
    }

    // Perform batch update
    await github.batchUpdateFiles(batchUpdates);

    return String(id);
  } catch (error) {
    console.error('Error saving entry:', error);
    throw new Error('Failed to save entry');
  }
};

export const forceResyncAndClearCache = async (): Promise<void> => {
  try {
    await db.delete();
    await db.open();
    await resyncLibrary();
  } catch (error) {
    console.error('Error during force resync:', error);
    // Don't throw here, as the database operations might have partially succeeded
    console.warn('Force resync completed with errors:', error);
  }
};

export const syncWithGitHub = async (): Promise<void> => {
  try {
    // Get all entries from GitHub
    const githubEntries = await github.listEntries();
    
    // Process entries and update local database
    const processedEntries = githubEntries
      .filter(validateGitHubEntry)
      .map(convertGitHubEntryToSchema);
      
    // Get files that need to be uploaded
    const files = processedEntries.flatMap(entry => 
      entry.images.map(img => ({
        url: img.url,
        thumbnail: img.thumbnail,
        size: img.size
      }))
    );
    
    // Process and upload files
    const imageUploads = processFiles(files);
    if (imageUploads.length > 0) {
      await github.uploadImagesWithMetadata(imageUploads);
    }

    // Update local database with processed entries
    await db.transaction('rw', db.entries, async () => {
      await db.entries.clear();
      await db.entries.bulkAdd(processedEntries.map(entry => convertToDBEntry(entry)));
    });

    console.debug('GitHub sync completed successfully');
  } catch (error) {
    console.error('Error syncing with GitHub:', error);
    throw error;
  }
};