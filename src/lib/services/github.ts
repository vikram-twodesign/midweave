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

export interface BatchFileUpdate {
  path: string;
  content: string;
  message: string;
}

export interface ImageUpload {
  file: File | {
    url: string;
    thumbnail: string;
    size: number;
  };
  path: string;
}

export class GitHubService {
  private static instance: GitHubService;
  private initialized = false;
  private syncInProgress = false;
  private octokit!: Octokit;
  private owner: string = '';
  private repo: string = '';
  private branch: string = '';
  private baseUrl: string = '';

  constructor() {
    if (GitHubService.instance) {
      return GitHubService.instance;
    }

    const { isValid, errors } = validateConfig();
    if (!isValid) {
      console.error('GitHub configuration errors:', errors);
      throw new Error(`GitHub service configuration error: ${errors.join(', ')}`);
    }

    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.branch = config.github.branch;
    this.baseUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}`;
    this.octokit = new Octokit({ auth: config.github.token });

    if (process.env.NODE_ENV === 'development') {
      console.debug('GitHub service initialized with:', {
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        baseUrl: this.baseUrl
      });
    }

    GitHubService.instance = this;
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('GitHubService not properly initialized');
    }
  }

  private getFullUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, '');
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
    this.ensureInitialized();

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
    this.ensureInitialized();

    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: `data/entries/${id}.json`,
        ref: this.branch,
      });

      if (Array.isArray(response.data) || !('type' in response.data) || response.data.type !== 'file') {
        console.error(`No file content found for entry ${id}`);
        return null;
      }

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
      
      if (Array.isArray(entry.images)) {
        entry.images = entry.images.map(image => {
          const normalizeUrl = (url: string) => {
            const filename = url.split('/').pop();
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
      
      if (Array.isArray(entry.images)) {
        entry.images.forEach(image => {
          console.log(`Processed image:`, image);
        });
      }

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

        if (processedImages.length === 0) {
          console.error(`No valid images found in entry ${id}`);
          return null;
        }

        entry.images = processedImages;
      } catch (error) {
        console.error(`Error processing images for entry ${id}:`, error);
        return null;
      }

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
    this.ensureInitialized();

    try {
      const files = await this.listFiles('data/entries');
      const jsonFiles = files.filter(file => 
        file.name.endsWith('.json') && 
        !file.name.startsWith('.') && 
        !file.name.includes('deleted')
      );

      const entries = await Promise.all(
        jsonFiles.map(async file => {
          const id = file.name.replace('.json', '');
          return await this.getEntry(id);
        })
      );

      return entries.filter((entry): entry is Entry => entry !== null);
    } catch (error) {
      console.error('Error listing entries:', error);
      return [];
    }
  }

  async uploadImage(file: File, path: string): Promise<string> {
    this.ensureInitialized();

    try {
      const filename = path.split('/').pop();
      if (!filename) {
        throw new Error('Invalid file path');
      }

      const safePath = path.startsWith('images/originals/') ? path : `images/originals/${filename}`;
      console.debug('Uploading image:', { originalPath: path, safePath });

      const base64Content = await this.fileToBase64(file);

      try {
        const { sha } = await this.getFileContent(safePath);
        
        if (sha) {
          const timestamp = Date.now();
          const newFilename = `${timestamp}_${filename}`;
          const newPath = `images/originals/${newFilename}`;
          console.debug('File exists, using new path:', { originalPath: path, newPath });
          return this.uploadImage(file, newPath);
        }
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('404'))) {
          console.warn('Error checking existing file:', error);
        }
      }

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: safePath,
        message: `Upload image: ${filename}`,
        content: base64Content,
        branch: this.branch
      });

      console.debug('Image uploaded successfully:', { safePath });
      return safePath;
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        const timestamp = Date.now();
        const newPath = `images/originals/${timestamp}_${path.split('/').pop()}`;
        console.debug('Retrying upload with new path due to conflict:', { originalPath: path, newPath });
        return this.uploadImage(file, newPath);
      }

      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async saveMetadata(data: Record<string, any>, path: string): Promise<void> {
    try {
      const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
      const safePath = cleanPath.startsWith('data/entries/') ? cleanPath : `data/entries/${cleanPath}`;
      
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

      console.log('Saving metadata:', { path: safePath, contentLength: content.length });

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
      
      const timestamp = new Date().toISOString();
      const batchId = Math.random().toString(36).substring(7);
      await this.createEmptyCommit(`Batch delete entries [${batchId}]`);

      for (const id of ids) {
        try {
          await this.deleteEntry(id);
        } catch (error) {
          console.error(`Error deleting entry ${id}:`, error);
        }
      }

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
    this.ensureInitialized();

    try {
      const entries: Entry[] = [];
      const files = await this.listFiles('data/entries');

      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          try {
            const { content } = await this.getFileContent(file.path);
            const entry = JSON.parse(content) as Entry;
            
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

  private async triggerDeployment(action: string, content: Record<string, any> = {}): Promise<void> {
    if (this.syncInProgress) {
      console.debug('Sync in progress, skipping deployment trigger');
      return;
    }

    try {
      const timestamp = Date.now();
      const deployId = Math.random().toString(36).substring(2, 8);
      const markerPath = `data/.deployment/${timestamp}-${deployId}.json`;

      try {
        // Check for recent deployment markers
        const { data: deployments } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: 'data/.deployment',
          ref: this.branch
        });

        if (Array.isArray(deployments)) {
          const recentMarkers = deployments
            .filter(d => d.type === 'file' && d.name.endsWith('.json'))
            .map(d => ({
              name: d.name,
              timestamp: parseInt(d.name.split('-')[0], 10)
            }))
            .filter(d => !isNaN(d.timestamp) && Date.now() - d.timestamp < 60000); // Last minute

          if (recentMarkers.length > 0) {
            console.debug('Recent deployment found, skipping:', recentMarkers[0]);
            return;
          }
        }

        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: markerPath,
          message: `Deployment trigger: ${action} [${timestamp}]`,
          content: Buffer.from(JSON.stringify({ ...content, action, deployId, timestamp }, null, 2)).toString('base64'),
          branch: this.branch
        });
        console.log('Deployment triggered:', { action, deployId });
      } catch (error) {
        if (error instanceof Error) {
          console.warn('Non-critical error creating deployment marker:', error.message);
        }
      }
    } catch (error) {
      console.warn('Failed to trigger deployment:', error);
    }
  }

  async resyncLibrary(): Promise<Entry[]> {
    if (this.syncInProgress) {
      console.debug('Sync already in progress, skipping');
      return [];
    }

    this.syncInProgress = true;
    this.ensureInitialized();

    try {
      console.debug('Starting library resync...');
      
      await this.triggerDeployment('resync-start');
      
      // First get all image files that actually exist
      const imageFiles = await this.listFiles('images/originals');
      const validImagePaths = new Set(imageFiles.map(f => f.path));
      console.debug('Found image files:', { count: validImagePaths.size });

      const allEntries = await this.getAllEntries();
      console.debug('Fetched entries from GitHub:', { count: allEntries.length });

      const validEntries = new Map<string, Entry>();

      for (const entry of allEntries) {
        try {
          let isValid = true;
          for (const img of entry.images) {
            const url = new URL(img.url);
            const filename = url.pathname.split('/').pop();
            if (!filename) continue;
            
            const imagePath = `images/originals/${filename}`;
            if (!validImagePaths.has(imagePath)) {
              isValid = false;
              console.warn(`Image file missing for entry ${entry.id}:`, imagePath);
              break;
            }
          }

          if (isValid) {
            validEntries.set(entry.id, entry);
          }
        } catch (error) {
          console.warn(`Error validating entry ${entry.id}:`, error);
        }
      }

      await this.triggerDeployment('resync-complete', {
        stats: {
          validEntries: validEntries.size,
          validFiles: validImagePaths.size,
          totalFiles: imageFiles.length
        }
      });

      console.debug('Library resync completed:', {
        validEntries: validEntries.size,
        validFiles: validImagePaths.size,
        totalFiles: imageFiles.length
      });

      return Array.from(validEntries.values());
    } catch (error) {
      console.error('Error during library resync:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
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

  async batchUpdateFiles(updates: BatchFileUpdate[]): Promise<void> {
    this.ensureInitialized();

    try {
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Get current tree
          const { data: ref } = await this.octokit.rest.git.getRef({
            owner: this.owner,
            repo: this.repo,
            ref: `heads/${this.branch}`
          });

          const { data: commit } = await this.octokit.rest.git.getCommit({
            owner: this.owner,
            repo: this.repo,
            commit_sha: ref.object.sha
          });

          const { data: baseTree } = await this.octokit.rest.git.getTree({
            owner: this.owner,
            repo: this.repo,
            tree_sha: commit.tree.sha
          });

          // Create blobs for each file
          const blobs = await Promise.all(
            updates.map(async (update) => {
              const { data } = await this.octokit.rest.git.createBlob({
                owner: this.owner,
                repo: this.repo,
                content: update.content,
                encoding: 'base64'
              });
              return {
                path: update.path,
                mode: '100644' as const,
                type: 'blob' as const,
                sha: data.sha
              };
            })
          );

          // Create new tree
          const { data: newTree } = await this.octokit.rest.git.createTree({
            owner: this.owner,
            repo: this.repo,
            base_tree: baseTree.sha,
            tree: blobs
          });

          // Create commit
          const { data: newCommit } = await this.octokit.rest.git.createCommit({
            owner: this.owner,
            repo: this.repo,
            message: updates.map(u => u.message).join('\n'),
            tree: newTree.sha,
            parents: [ref.object.sha]
          });

          // Update branch reference with force flag
          await this.octokit.rest.git.updateRef({
            owner: this.owner,
            repo: this.repo,
            ref: `heads/${this.branch}`,
            sha: newCommit.sha,
            force: true // Add force flag to handle non-fast-forward updates
          });

          console.debug('Batch update completed successfully:', {
            count: updates.length,
            paths: updates.map(u => u.path),
            commitSha: newCommit.sha
          });

          // If successful, break out of retry loop
          break;

        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          console.warn(`Retry ${retryCount}/${maxRetries} due to concurrent update:`, error);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }

  async updateMetadata(data: Record<string, any>, path: string): Promise<void> {
    try {
      const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
      const safePath = cleanPath.startsWith('data/entries/') ? cleanPath : `data/entries/${cleanPath}`;
      
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      console.debug('Saving metadata:', { path: safePath, contentLength: content.length });

      await this.batchUpdateFiles([
        {
          path: safePath,
          content,
          message: `Update metadata: ${safePath}`
        }
      ]);

      console.debug('Metadata saved successfully:', { path: safePath });
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  async uploadImagesWithMetadata(uploads: ImageUpload[]): Promise<void> {
    try {
      console.debug('Starting batch image upload:', { count: uploads.length });
      
      const batchUpdates: BatchFileUpdate[] = [];
      
      for (const upload of uploads) {
        try {
          if (upload.file instanceof File) {
            // Handle raw File object
            const base64Content = await this.fileToBase64(upload.file);
            batchUpdates.push({
              path: upload.path,
              content: base64Content,
              message: `Upload image: ${upload.path.split('/').pop()}`
            });
          } else {
            // Handle image data object
            const content = JSON.stringify(upload.file);
            batchUpdates.push({
              path: upload.path,
              content: Buffer.from(content).toString('base64'),
              message: `Upload image metadata: ${upload.path}`
            });
          }
        } catch (error) {
          console.error('Error preparing image upload:', error);
          throw error;
        }
      }

      if (batchUpdates.length > 0) {
        await this.batchUpdateFiles(batchUpdates);
      }

      console.debug('Batch image upload completed successfully');
    } catch (error) {
      console.error('Error in batch image upload:', error);
      throw error;
    }
  }

  async createEntry(entry: Entry, imageFile: File): Promise<void> {
    this.ensureInitialized();

    try {
      // Prepare both the image and data files
      const imageBuffer = await imageFile.arrayBuffer();
      const imageContent = Buffer.from(imageBuffer).toString('base64');
      const imagePath = `images/originals/${entry.images[0].url.split('/').pop()}`;
      
      const entryContent = JSON.stringify(entry, null, 2);
      const entryPath = `data/entries/${entry.id}.json`;

      // Create a tree with both files
      const tree = [
        {
          path: imagePath,
          mode: '100644' as const,
          type: 'blob' as const,
          content: imageContent
        },
        {
          path: entryPath,
          mode: '100644' as const,
          type: 'blob' as const,
          content: entryContent
        }
      ];

      // Get the latest commit SHA
      const latestCommit = await this.octokit.rest.repos.getBranch({
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
      });
      const latestTreeSha = latestCommit.data.commit.commit.tree.sha;

      // Create a new tree with both files
      const newTree = await this.octokit.rest.git.createTree({
        owner: this.owner,
        repo: this.repo,
        base_tree: latestTreeSha,
        tree: tree
      });

      // Create a commit with the new tree
      const newCommit = await this.octokit.rest.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message: `Add entry ${entry.id} with image`,
        tree: newTree.data.sha,
        parents: [latestCommit.data.commit.sha]
      });

      // Update the branch reference
      await this.octokit.rest.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.branch}`,
        sha: newCommit.data.sha
      });

    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  }
}

export default new GitHubService(); 