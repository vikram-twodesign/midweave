import { Octokit } from '@octokit/rest';
import { Base64 } from 'js-base64';
import { config, validateConfig } from '@/lib/config';
import { RequestError } from '@octokit/request-error';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

type GetContentResponse = RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];
type GitHubFileContent = Extract<GetContentResponse, { type: "file" }>;
type GitHubContent = GetContentResponse;

interface Entry {
  id: string;
  images: Array<{ 
    url: string; 
    thumbnail?: string; 
    size?: number;
  }>;
  title: string;
  description: string;
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

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private baseUrl: string;

  constructor() {
    const { isValid, errors } = validateConfig();
    if (!isValid) {
      console.error('GitHub configuration errors:', errors);
      throw new Error(`GitHub service configuration error: ${errors.join(', ')}`);
    }

    if (!config.github.owner || !config.github.repo) {
      console.error('GitHub repository not configured correctly:', {
        owner: config.github.owner,
        repo: config.github.repo,
        repository: process.env.NEXT_PUBLIC_REPOSITORY
      });
      throw new Error('GitHub repository must be configured as "owner/repo" in NEXT_PUBLIC_REPOSITORY');
    }

    this.octokit = new Octokit({
      auth: config.github.token,
    });
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.branch = config.github.branch;
    this.baseUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}`;

    console.log('GitHub service initialized with:', {
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      baseUrl: this.baseUrl
    });
  }

  private getFullUrl(path: string): string {
    // Remove any leading slashes and join with base URL
    const cleanPath = path.replace(/^\/+/, '');
    // If the path is already a full URL, return it as is
    if (cleanPath.startsWith('http')) {
      return cleanPath;
    }
    return `${this.baseUrl}/${cleanPath}`;
  }

  private async getFileContent(path: string): Promise<{ content: string; sha: string }> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch
      });

      if (Array.isArray(response.data)) {
        throw new Error('Path points to a directory, not a file');
      }

      // Type guard to ensure we have a file with content
      if (response.data.type === 'file' && response.data.content) {
        return {
          content: Base64.decode(response.data.content),
          sha: response.data.sha
        };
      }
      
      throw new Error('Invalid response format: content not available');
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        return { content: '', sha: '' };
      }
      throw error;
    }
  }

  async listFiles(path: string): Promise<Array<{ name: string; path: string; type: string }>> {
    if (!this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Expected directory content');
      }

      return response.data;
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async getEntry(id: string): Promise<Entry | null> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: `data/entries/${id}.json`,
        ref: this.branch,
      });

      // Check if response is an array (directory listing) or not a file
      if (Array.isArray(response.data) || !('type' in response.data) || response.data.type !== 'file') {
        console.error(`No file content found for entry ${id}`);
        return null;
      }

      // At this point TypeScript knows response.data is a file object
      const content = response.data.content;
      if (!content) {
        console.error(`Empty content for entry ${id}`);
        return null;
      }

      const decodedContent = Buffer.from(content, 'base64').toString();
      console.log(`Raw file content for entry ${id}:`, decodedContent);
      
      let entry: Entry;
      
      try {
        entry = JSON.parse(decodedContent);
        if (typeof entry === 'string') {
          entry = JSON.parse(entry);
        }
        console.log(`Parsed entry ${id}:`, {
          hasId: !!entry.id,
          hasImages: Array.isArray(entry.images),
          imageCount: Array.isArray(entry.images) ? entry.images.length : 0
        });
      } catch (parseError) {
        console.error(`Error parsing entry ${id}:`, parseError);
        return null;
      }

      // Basic validation
      if (!entry || (typeof entry.id !== 'string' && typeof entry.id !== 'number')) {
        console.error(`Entry ${id} missing required id field`);
        return null;
      }

      if (!Array.isArray(entry.images)) {
        console.error(`Entry ${id} missing images array`);
        return null;
      }

      if (entry.images.length === 0) {
        console.error(`Entry ${id} has no images`);
        return null;
      }
      
      console.log('Raw entry from GitHub:', entry);
      
      // Process images to ensure URLs are correct
      if (Array.isArray(entry.images)) {
        entry.images = entry.images.map(image => {
          // Fix malformed URLs by removing duplicate paths and nested directories
          const normalizeUrl = (url: string) => {
            // Extract the filename from the path
            const filename = url.split('/').pop();
            // Construct the correct URL with just images/originals/filename
            return `${this.baseUrl}/images/originals/${filename}`;
          };

          return {
            ...image,
            url: normalizeUrl(image.url),
            thumbnail: image.thumbnail ? normalizeUrl(image.thumbnail) : normalizeUrl(image.url)
          };
        });
      }

      console.log(`Raw entry from GitHub:`, entry);
      
      // Process images to ensure URLs are correct
      if (Array.isArray(entry.images)) {
        entry.images.forEach(image => {
          console.log(`Processed image:`, image);
        });
      }

      // Transform image URLs to full URLs if they're relative paths
      try {
        const processedImages = entry.images.map(img => {
          if (!img || typeof img.url !== 'string') {
            console.error(`Invalid image format in entry ${id}:`, img);
            return null;
          }

          const processedImage = {
            ...img,
            url: this.getFullUrl(img.url),
            thumbnail: img.thumbnail ? this.getFullUrl(img.thumbnail) : undefined,
            size: img.size || 0
          };
          console.log('Processed image:', processedImage);
          return processedImage;
        }).filter((img): img is NonNullable<typeof img> => img !== null);

        // If no valid images remain, skip this entry
        if (processedImages.length === 0) {
          console.error(`No valid images found in entry ${id}`);
          return null;
        }

        entry.images = processedImages;
      } catch (error) {
        console.error(`Error processing images for entry ${id}:`, error);
        return null;
      }

      // Ensure all required fields are present
      entry = {
        id: entry.id,
        title: entry.title || '',
        description: entry.description || '',
        images: entry.images,
        parameters: entry.parameters || {
          sref: '',
          prompt: '',
          style: '',
          ar: '',
          chaos: null,
          version: '',
          quality: null,
          stylize: null
        },
        adminMetadata: entry.adminMetadata || {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          featured: false,
          curatorNotes: ''
        },
        aiAnalysis: entry.aiAnalysis || {
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
        }
      };
      
      return entry;
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        return null;
      }
      console.error(`Error fetching entry ${id}:`, error);
      return null;
    }
  }

  async listEntries(): Promise<Entry[]> {
    const entries: Entry[] = [];
    try {
      const files = await this.listFiles('data/entries');
      
      const entryPromises = files.map(async (file) => {
        try {
          const entryId = file.name.replace('.json', '');
          const entry = await this.getEntry(entryId);
          if (entry && Array.isArray(entry.images) && entry.images.length > 0) {
            entries.push(entry);
          }
        } catch (error) {
          console.error(`Error processing entry ${file.name}:`, error);
          // Continue with other entries
        }
      });

      await Promise.all(entryPromises);
      return entries;
    } catch (error) {
      console.error('Error listing entries:', error);
      return entries; // Return any entries we managed to process
    }
  }

  async uploadImage(file: File, path: string): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      // Extract just the filename and ensure it's in the correct directory
      const filename = path.split('/').pop();
      if (!filename) {
        throw new Error('Invalid file path');
      }
      const safePath = `images/originals/${filename}`;
      
      console.log('Uploading image:', { originalPath: path, safePath });
      
      const content = await this.fileToBase64(file);
      const { sha } = await this.getFileContent(safePath);

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: safePath,
        message: sha ? `Update ${safePath}` : `Create ${safePath}`,
        content,
        sha: sha || undefined,
        branch: this.branch
      });

      console.log('Image uploaded successfully:', { safePath });
      return this.getFullUrl(safePath);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async saveMetadata(data: Record<string, any>, path: string): Promise<void> {
    try {
      // Clean the path to ensure proper formatting
      const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
      const safePath = cleanPath.startsWith('data/entries/') ? cleanPath : `data/entries/${cleanPath}`;
      
      // Convert data to base64
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

      console.log('Saving metadata:', { path: safePath, contentLength: content.length });

      // Get the current file's SHA if it exists
      const { sha } = await this.getFileContent(safePath);

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: safePath,
        message: sha ? `Update ${safePath}` : `Create ${safePath}`,
        content,
        sha: sha || undefined,
        branch: this.branch
      });

      console.log('Metadata saved successfully:', { path: safePath });
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      console.log('Starting entry deletion process:', { id });
      
      // Get the entry first to get all associated files
      const entry = await this.getEntry(id);
      if (!entry) {
        console.log(`Entry ${id} not found in GitHub, creating deletion marker`);
        await this.createDeletionMarker(id);
        return;
      }

      console.log('Found entry to delete:', { 
        id, 
        imageCount: entry.images.length,
        images: entry.images.map(img => img.url)
      });

      // Delete all associated images first
      for (const img of entry.images) {
        const url = new URL(img.url);
        const filename = url.pathname.split('/').pop();
        if (!filename) {
          console.warn(`Invalid image URL: ${img.url}`);
          continue;
        }
        
        const imagePath = `images/originals/${filename}`;
        console.log('Deleting image:', { imagePath });
        
        try {
          await this.deleteFile(imagePath);
          console.log('Image deleted successfully:', { imagePath });
        } catch (error) {
          if (error instanceof RequestError && error.status === 404) {
            console.log(`Image ${imagePath} already deleted or not found`);
            continue;
          }
          throw error;
        }
      }

      // Delete the metadata file
      const metadataPath = `data/entries/${id}.json`;
      console.log('Deleting metadata file:', { metadataPath });
      
      try {
        await this.deleteFile(metadataPath);
        console.log('Metadata file deleted successfully:', { metadataPath });
      } catch (error) {
        if (error instanceof RequestError && error.status === 404) {
          console.log(`Metadata file ${metadataPath} already deleted or not found`);
        } else {
          throw error;
        }
      }

      console.log('Entry deletion completed successfully:', { id });
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }

  private async createEmptyCommit(message: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const markerPath = '.github/deployment-markers/marker-' + timestamp.replace(/[:.]/g, '-') + '.txt';
      
      // Create a unique marker file for each deployment
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: markerPath,
        message: `${message} [${timestamp}]`,
        content: Buffer.from(`Deployment trigger: ${timestamp}\nAction: ${message}`).toString('base64'),
        branch: this.branch
      });

      console.log('Created deployment marker:', { markerPath, message });
    } catch (error) {
      console.error('Error creating deployment marker:', error);
      // Don't throw error as this is just a helper function
    }
  }

  private async createDeletionMarker(id: string): Promise<void> {
    try {
      const markerPath = `data/entries/.deleted-${id}`;
      const timestamp = new Date().toISOString();
      
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: markerPath,
        message: `Mark entry ${id} as deleted`,
        content: Buffer.from(timestamp).toString('base64'),
        branch: this.branch
      });
    } catch (error) {
      console.error('Error creating deletion marker:', error);
      // Don't throw error as this is just a helper function
    }
  }

  private async getFileSha(path: string): Promise<string | undefined> {
    try {
      const { sha } = await this.getFileContent(path);
      return sha;
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      console.log('Attempting to delete file:', { path });
      
      // Get the latest SHA for the file
      const { sha } = await this.getFileContent(path);
      
      if (!sha) {
        const error = new Error(`File ${path} not found (no SHA)`);
        error.name = 'FileNotFoundError';
        throw error;
      }

      await this.octokit.rest.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Delete ${path}`,
        sha,
        branch: this.branch
      });

      console.log('File deleted successfully:', { path });
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        const notFoundError = new Error(`File ${path} not found`);
        notFoundError.name = 'FileNotFoundError';
        throw notFoundError;
      }
      throw error;
    }
  }

  async batchDeleteEntries(ids: string[]): Promise<void> {
    try {
      console.log('Starting batch deletion:', { ids });
      
      // Create a single deployment marker for the batch
      const timestamp = new Date().toISOString();
      const batchId = Math.random().toString(36).substring(7);
      await this.createEmptyCommit(`Batch delete entries [${batchId}]`);

      // Process deletions sequentially to avoid conflicts
      for (const id of ids) {
        try {
          await this.deleteEntry(id);
        } catch (error) {
          console.error(`Error deleting entry ${id}:`, error);
          // Continue with other deletions
        }
      }

      // Create a completion marker
      const completionPath = `.github/deployment-markers/batch-${batchId}-complete.txt`;
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: completionPath,
        message: `Complete batch deletion [${batchId}]`,
        content: Buffer.from(`Batch deletion complete: ${timestamp}\nDeleted IDs: ${ids.join(', ')}`).toString('base64'),
        branch: this.branch
      });

      console.log('Batch deletion completed:', { batchId, ids });
    } catch (error) {
      console.error('Error in batch deletion:', error);
      throw error;
    }
  }

  async getAllEntries(): Promise<Entry[]> {
    if (!this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      const entries: Entry[] = [];
      const files = await this.listFiles('data/entries');

      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          try {
            const { content } = await this.getFileContent(file.path);
            const entry = JSON.parse(content) as Entry;
            
            // Process images to ensure URLs are correct
            if (Array.isArray(entry.images)) {
              entry.images = entry.images.map(image => ({
                ...image,
                url: this.getFullUrl(image.url),
                thumbnail: image.thumbnail ? this.getFullUrl(image.thumbnail) : this.getFullUrl(image.url)
              }));
            }

            entries.push(entry);
          } catch (error) {
            console.error(`Error reading entry file ${file.name}:`, error);
          }
        }
      }

      return entries;
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  private async triggerDeployment(action: string, details: Record<string, unknown> = {}): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const deployId = Math.random().toString(36).substring(7);
      const markerPath = `.github/deployment-markers/deploy-${deployId}.txt`;
      
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: markerPath,
        message: `Deployment trigger: ${action} [${deployId}]`,
        content: Buffer.from(
          JSON.stringify({
            timestamp,
            action,
            deployId,
            ...details
          }, null, 2)
        ).toString('base64'),
        branch: this.branch
      });

      console.log('Deployment triggered:', { action, deployId });
    } catch (error) {
      console.error('Error triggering deployment:', error);
      // Don't throw error as this is a helper function
    }
  }

  async resyncLibrary(): Promise<Entry[]> {
    try {
      console.log('Starting library resync...');
      
      // Create a resync marker to trigger deployment
      await this.triggerDeployment('resync-start');
      
      // First, get all entries from GitHub
      const allEntries = await this.getAllEntries();
      console.log('Fetched entries from GitHub:', { count: allEntries.length });

      // Create a map of valid entries and their files
      const validEntries = new Map<string, Entry>();
      const validFiles = new Set<string>();

      // Validate each entry and its files
      for (const entry of allEntries) {
        try {
          // Check if all referenced images exist
          let isValid = true;
          for (const img of entry.images) {
            const url = new URL(img.url);
            const filename = url.pathname.split('/').pop();
            if (!filename) continue;
            
            const imagePath = `images/originals/${filename}`;
            try {
              const exists = await this.fileExists(imagePath);
              if (exists) {
                validFiles.add(imagePath);
              } else {
                isValid = false;
                console.warn(`Image file missing for entry ${entry.id}:`, imagePath);
              }
            } catch (error) {
              console.error(`Error checking image ${imagePath}:`, error);
              isValid = false;
            }
          }

          if (isValid) {
            validEntries.set(entry.id, entry);
          }
        } catch (error) {
          console.error(`Error validating entry ${entry.id}:`, error);
        }
      }

      // Get all files in the images directory
      const imageFiles = await this.listFiles('images/originals');
      const imagePaths = imageFiles.map(f => f.path);
      console.log('Found image files:', { count: imagePaths.length });

      // Delete orphaned files (files not referenced by any valid entry)
      for (const filePath of imagePaths) {
        if (!validFiles.has(filePath)) {
          console.log('Deleting orphaned file:', filePath);
          try {
            await this.deleteFile(filePath);
          } catch (error) {
            console.error(`Error deleting orphaned file ${filePath}:`, error);
          }
        }
      }

      // Create resync completion marker
      await this.triggerDeployment('resync-complete', {
        stats: {
          validEntries: validEntries.size,
          validFiles: validFiles.size,
          totalFiles: imagePaths.length
        }
      });

      console.log('Library resync completed:', {
        validEntries: validEntries.size,
        validFiles: validFiles.size,
        totalFiles: imagePaths.length
      });

      return Array.from(validEntries.values());
    } catch (error) {
      console.error('Error during library resync:', error);
      throw error;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch
      });
      return true;
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

export default new GitHubService(); 