import { Octokit } from '@octokit/rest';
import { Base64 } from 'js-base64';

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    });
    this.owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || '';
    this.repo = process.env.NEXT_PUBLIC_GITHUB_REPO || '';
  }

  private async getFileContent(path: string) {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (!Array.isArray(response.data) && response.data.type === 'file') {
        return {
          content: response.data.content,
          sha: response.data.sha,
        };
      }
      throw new Error('Not a file');
    } catch (error: any) {
      if (error.status === 404) {
        return { content: '', sha: '' };
      }
      throw error;
    }
  }

  async saveMetadata(path: string, data: any) {
    try {
      const fileContent = await this.getFileContent(path);
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Update ${path}`,
        content,
        sha: fileContent.sha || undefined,
      });
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  async listEntries(): Promise<any[]> {
    if (!this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      const { data: files } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'data/entries',
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

  async uploadImage(file: File, path: string): Promise<string> {
    if (!this.octokit) {
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
      });

      // Return the raw URL for the uploaded file
      return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${path}`;
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
        });
        
        return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${path}`;
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

  async deleteFile(path: string): Promise<void> {
    if (!this.octokit) {
      throw new Error('GitHub service is not properly configured.');
    }

    try {
      // First get the file to get its SHA
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      if (!Array.isArray(data) && 'sha' in data) {
        // Delete the file using its SHA
        await this.octokit.rest.repos.deleteFile({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Delete ${path}`,
          sha: data.sha,
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

export default new GitHubService(); 