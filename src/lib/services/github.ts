import { Octokit } from '@octokit/rest';
import { config, validateGitHubConfig } from '@/lib/config';
import { Buffer } from 'buffer';

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = validateGitHubConfig();

    this.octokit = new Octokit({
      auth: config.github.token,
    });

    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.branch = config.github.branch;
  }

  private ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error('GitHub service is not properly configured. Check your environment variables.');
    }
  }

  async listEntries() {
    try {
      this.ensureConfigured();

      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'data/entries',
        ref: this.branch,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      const entries = await Promise.all(
        response.data
          .filter(file => file.name.endsWith('.json'))
          .map(async file => {
            try {
              const { content } = await this.getFileContent(file.path);
              return JSON.parse(content);
            } catch (error) {
              console.error(`Error fetching entry ${file.name}:`, error);
              return null;
            }
          })
      );

      return entries.filter(entry => entry !== null);
    } catch (error) {
      console.error('Error listing entries:', error);
      return [];
    }
  }

  private async getFileContent(path: string): Promise<{ content: string; sha: string }> {
    this.ensureConfigured();
    
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      if (Array.isArray(response.data) || response.data.type !== 'file') {
        throw new Error('Invalid file response');
      }

      return {
        content: Buffer.from(response.data.content, 'base64').toString('utf8'),
        sha: response.data.sha,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return { content: '', sha: '' };
      }
      throw error;
    }
  }

  // Upload an image to GitHub
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const content = Buffer.from(buffer).toString('base64');

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Upload image: ${path}`,
        content,
        branch: this.branch,
      });

      // Return the raw GitHub content URL
      return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Save metadata to GitHub
  async saveMetadata(data: any, path: string): Promise<void> {
    try {
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      const existingFile = await this.getFileContent(path);

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Update metadata: ${path}`,
        content,
        sha: existingFile.sha || undefined,
        branch: this.branch,
      });
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  // Delete a file from GitHub
  async deleteFile(path: string): Promise<void> {
    try {
      const { sha } = await this.getFileContent(path);
      if (sha) {
        await this.octokit.repos.deleteFile({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Delete file: ${path}`,
          sha,
          branch: this.branch,
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
} 