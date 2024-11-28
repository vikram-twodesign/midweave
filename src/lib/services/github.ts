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
          content: response.data.content,
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

  async listFiles(path: string): Promise<Array<{ name: string }>> {
    if (!this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      console.log(`Listing files in ${path}...`);
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch
      });

      if (!Array.isArray(response.data)) {
        console.error('Invalid response format - expected array:', response.data);
        throw new Error('Invalid response format');
      }

      console.log(`Found ${response.data.length} files in ${path}:`, 
        response.data.map(file => file.name));

      return response.data
        .filter((file): file is GitHubFileContent => 
          file.type === 'file' && 
          typeof file.name === 'string'
        )
        .filter(file => file.name.endsWith('.json'))
        .map(file => ({ name: file.name }));
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        console.log(`No files found in ${path}`);
        return []; // Return empty array if directory doesn't exist yet
      }
      console.error(`Error listing files in ${path}:`, error);
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

  async deleteFile(path: string): Promise<void> {
    try {
      console.log('Attempting to delete file:', { path });
      
      // Get the latest SHA for the file
      const { sha } = await this.getFileContent(path);
      
      if (!sha) {
        console.warn(`File ${path} not found (no SHA), skipping deletion`);
        return;
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
        console.warn(`File ${path} not found, skipping deletion`);
        return;
      }
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      console.log('Starting entry deletion process:', { id });
      
      // Get the entry first to get all associated files
      const entry = await this.getEntry(id);
      if (!entry) {
        console.warn(`Entry ${id} not found, skipping deletion`);
        return;
      }

      console.log('Found entry to delete:', { 
        id, 
        imageCount: entry.images.length,
        images: entry.images.map(img => img.url)
      });

      // Delete all associated images first
      for (const img of entry.images) {
        try {
          // Extract just the filename from the URL
          const url = new URL(img.url);
          const filename = url.pathname.split('/').pop();
          if (!filename) {
            console.warn(`Invalid image URL: ${img.url}`);
            continue;
          }
          
          const imagePath = `images/originals/${filename}`;
          console.log('Deleting image:', { imagePath });
          await this.deleteFile(imagePath);
          console.log('Image deleted successfully:', { imagePath });
        } catch (error) {
          console.error(`Error deleting image ${img.url}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Delete the metadata file
      const metadataPath = `data/entries/${id}.json`;
      console.log('Deleting metadata file:', { metadataPath });
      
      try {
        await this.deleteFile(metadataPath);
        console.log('Metadata file deleted successfully:', { metadataPath });
      } catch (error) {
        console.error(`Error deleting metadata file ${metadataPath}:`, error);
        throw error; // Rethrow as metadata deletion is critical
      }

      console.log('Entry deletion completed successfully:', { id });
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }
}

export default new GitHubService(); 