import { config } from '@/lib/config';

export class GitHubService {
  private baseUrl = 'https://api.github.com';
  private owner: string;
  private repo: string;

  constructor() {
    const repository = config.github.repository;
    if (!repository) {
      throw new Error('Repository configuration is missing');
    }
    
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      throw new Error('Repository must be in format "owner/repo"');
    }
    
    this.owner = owner;
    this.repo = repo;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = config.github.accessToken;
    if (!token) {
      throw new Error('GitHub access token is missing');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    };

    try {
      console.log(`Making GitHub API request to: ${endpoint}`);
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error('GitHub API request failed:', error);
      throw error;
    }
  }

  async listEntries(): Promise<any[]> {
    try {
      console.log('Fetching entries from GitHub...');
      
      // Get the contents of the data/entries directory
      const response = await this.request(
        `/repos/${this.owner}/${this.repo}/contents/data/entries`
      );
      const files = await response.json();
      
      // Filter for .json files and fetch their contents
      const jsonFiles = files.filter((file: any) => 
        file.name.endsWith('.json') && file.name !== '.gitkeep'
      );
      
      console.log(`Found ${jsonFiles.length} entry files`);
      
      // Fetch the content of each file
      const entries = await Promise.all(
        jsonFiles.map(async (file: any) => {
          try {
            const contentResponse = await this.request(file.url);
            const contentData = await contentResponse.json();
            const content = JSON.parse(
              Buffer.from(contentData.content, 'base64').toString('utf-8')
            );
            return content;
          } catch (error) {
            console.error(`Error fetching content for file ${file.name}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any failed entries
      const validEntries = entries.filter(entry => entry !== null);
      console.log(`Successfully fetched ${validEntries.length} valid entries`);
      return validEntries;
    } catch (error) {
      console.error('Error listing entries:', error);
      throw new Error('Failed to list entries from GitHub');
    }
  }

  async saveMetadata(data: any, path: string): Promise<void> {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    try {
      // Ensure the directory exists
      const dirPath = path.split('/').slice(0, -1).join('/');
      try {
        await this.request(
          `/repos/${this.owner}/${this.repo}/contents/${dirPath}`
        );
      } catch (error) {
        // Directory doesn't exist, create it with a .gitkeep file
        console.log(`Creating directory: ${dirPath}`);
        await this.request(
          `/repos/${this.owner}/${this.repo}/contents/${dirPath}/.gitkeep`,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: `Create directory: ${dirPath}`,
              content: '',
              branch: 'main'
            })
          }
        );
      }

      // First try to get the file to see if it exists
      let sha: string | undefined;
      try {
        const response = await this.request(
          `/repos/${this.owner}/${this.repo}/contents/${path}`
        );
        const fileData = await response.json();
        sha = fileData.sha;
      } catch (error) {
        // File doesn't exist, which is fine for new files
        console.log(`File ${path} doesn't exist yet, creating new file`);
      }

      // Create or update the file
      const body: any = {
        message: sha ? `Update metadata: ${path}` : `Create metadata: ${path}`,
        content,
        branch: 'main'
      };

      // Only include sha if we're updating an existing file
      if (sha) {
        body.sha = sha;
      }

      await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
      );
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw new Error('Failed to save metadata');
    }
  }

  async uploadImage(file: File, path: string): Promise<string> {
    try {
      console.log(`Starting upload for file: ${file.name} to path: ${path}`);

      // Convert file to base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('File converted to base64');

      // Get current commit SHA
      const refResponse = await this.request(
        `/repos/${this.owner}/${this.repo}/git/refs/heads/main`
      );
      const refData = await refResponse.json();
      const latestCommitSha = refData.object.sha;

      console.log('Got latest commit SHA:', latestCommitSha);

      // Create blob
      const blobResponse = await this.request(
        `/repos/${this.owner}/${this.repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: base64Content,
            encoding: 'base64'
          })
        }
      );
      const blobData = await blobResponse.json();

      console.log('Created blob:', blobData.sha);

      // Get current tree
      const treeResponse = await this.request(
        `/repos/${this.owner}/${this.repo}/git/trees/${latestCommitSha}`
      );
      const treeData = await treeResponse.json();

      // Create new tree
      const newTreeResponse = await this.request(
        `/repos/${this.owner}/${this.repo}/git/trees`,
        {
          method: 'POST',
          body: JSON.stringify({
            base_tree: treeData.sha,
            tree: [{
              path,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha
            }]
          })
        }
      );
      const newTreeData = await newTreeResponse.json();

      console.log('Created new tree:', newTreeData.sha);

      // Create commit
      const commitResponse = await this.request(
        `/repos/${this.owner}/${this.repo}/git/commits`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: `Add image: ${path}`,
            tree: newTreeData.sha,
            parents: [latestCommitSha]
          })
        }
      );
      const commitData = await commitResponse.json();

      console.log('Created commit:', commitData.sha);

      // Update reference
      await this.request(
        `/repos/${this.owner}/${this.repo}/git/refs/heads/main`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            sha: commitData.sha,
            force: true
          })
        }
      );

      console.log('Updated reference, upload complete');

      // Return the raw URL for the image
      const imageUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${path}`;
      console.log('Image URL:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to upload image: ${errorMessage}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      // First get the file's SHA
      const response = await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`
      );
      const fileData = await response.json();
      const sha = fileData.sha;

      // Delete the file
      await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete file: ${path}`,
            sha,
            branch: 'main'
          })
        }
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }
} 