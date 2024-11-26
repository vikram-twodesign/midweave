import { Octokit } from '@octokit/rest';
import { config, validateGitHubConfig } from '@/lib/config';
import { Buffer } from 'buffer';

export class GitHubService {
  private octokit: Octokit | null = null;
  private owner: string = 'vikram-twodesign';
  private repo: string = 'midweave';
  private branch: string = 'main';
  private isConfigured: boolean = false;

  constructor() {
    const token = typeof window !== 'undefined' 
      ? window.__ENV__?.NEXT_PUBLIC_GITHUB_TOKEN 
      : process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    if (token) {
      this.octokit = new Octokit({ auth: token });
      this.isConfigured = true;
    }
  }

  private ensureConfigured(): asserts this is { octokit: Octokit } {
    if (!this.isConfigured || !this.octokit) {
      // Instead of throwing, return empty results for public routes
      if (typeof window !== 'undefined' && window.location.pathname === '/midweave') {
        return;
      }
      throw new Error('GitHub service is not properly configured. Check your environment variables.');
    }
  }

  async listEntries(): Promise<any[]> {
    if (!this.isConfigured || !this.octokit) {
      if (typeof window !== 'undefined' && window.location.pathname === '/midweave') {
        return [];
      }
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      const { data: files } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'data/entries',
        ref: this.branch,
      });

      if (!Array.isArray(files)) {
        throw new Error('Invalid response format');
      }

      // Filter out non-JSON files
      const jsonFiles = files.filter(file => file.name.endsWith('.json'));

      const entries = await Promise.all(
        jsonFiles.map(async (file: any) => {
          try {
            const { data } = await this.octokit!.rest.repos.getContent({
              owner: this.owner,
              repo: this.repo,
              path: `data/entries/${file.name}`,
              ref: this.branch,
            });

            if (Array.isArray(data) || !('content' in data)) {
              throw new Error('Invalid file content');
            }

            // Decode base64 content
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return JSON.parse(content);
          } catch (error) {
            console.error(`Error fetching entry ${file.name}:`, error);
            return null;
          }
        })
      );

      // Filter out any null entries from failed fetches
      return entries.filter(entry => entry !== null);
    } catch (error) {
      console.error('Error listing entries:', error);
      return [];
    }
  }

  async getFileContent(path: string): Promise<{ sha: string; content: string }> {
    if (!this.isConfigured || !this.octokit) {
      if (typeof window !== 'undefined' && window.location.pathname === '/midweave') {
        return { sha: '', content: '' };
      }
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      if (!Array.isArray(data) && 'sha' in data && 'content' in data) {
        // Decode base64 content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
          sha: data.sha,
          content,
        };
      }
      throw new Error('Invalid response format');
    } catch (error: any) {
      if (error.status === 404) {
        // Silently return empty values for non-existent files
        return { sha: '', content: '' };
      }
      throw error;
    }
  }

  async uploadImage(file: File, path: string): Promise<string> {
    if (!this.isConfigured || !this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      // Convert file to base64
      const content = await this.fileToBase64(file);
      
      // Try to get existing file's SHA
      const { sha } = await this.getFileContent(path);

      // Create or update file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: sha ? `Update ${path}` : `Create ${path}`,
        content,
        sha: sha || undefined,
        branch: this.branch
      });

      // Return the raw URL for the uploaded file
      return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
    } catch (error: any) {
      if (error.status === 409) {
        // On conflict, retry once with fresh SHA
        const { sha } = await this.getFileContent(path);
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Update ${path} (retry)`,
          content: await this.fileToBase64(file),
          sha: sha || undefined,
          branch: this.branch
        });
        
        return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
      }
      
      // Only log non-404 errors
      if (error.status !== 404) {
        console.error('Error uploading image:', error);
      }
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

  async saveMetadata(data: any, path: string): Promise<void> {
    this.ensureConfigured();

    try {
      // Get existing file's SHA (will be empty for new files)
      const { sha } = await this.getFileContent(path);

      // Prepare the content
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

      // Create or update the file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: sha ? `Update ${path}` : `Create ${path}`,
        content,
        sha: sha || undefined,
        branch: this.branch
      });
    } catch (error: any) {
      // Only log non-404 errors
      if (error.status !== 404) {
        console.error('Error saving metadata:', error);
      }
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    this.ensureConfigured();

    try {
      // First get the file to get its SHA
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch
      });

      if (!Array.isArray(data) && 'sha' in data) {
        // Delete the file using its SHA
        await this.octokit.rest.repos.deleteFile({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Delete ${path}`,
          sha: data.sha,
          branch: this.branch
        });
      }
    } catch (error: any) {
      if (error.status === 404) {
        // File doesn't exist, which is fine for deletion
        return;
      }
      console.error('Error deleting file:', error);
      throw error;
    }
  }
} 