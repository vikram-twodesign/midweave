import { config } from '@/lib/config';

export class GitHubService {
  private baseUrl = 'https://api.github.com';
  private owner: string;
  private repo: string;

  constructor() {
    const [owner, repo] = (process.env.NEXT_PUBLIC_REPOSITORY || '').split('/');
    if (!owner || !repo) {
      throw new Error('NEXT_PUBLIC_REPOSITORY environment variable must be set in format "owner/repo"');
    }
    this.owner = owner;
    this.repo = repo;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = process.env.NEXT_PUBLIC_MW_ACCESS_TOKEN;
    if (!token) {
      throw new Error('NEXT_PUBLIC_MW_ACCESS_TOKEN environment variable must be set');
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

  async saveMetadata(data: any, path: string): Promise<void> {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    try {
      // Create the file directly without checking if it exists
      await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: `Update metadata: ${path}`,
            content,
            branch: 'main'
          })
        }
      );
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw new Error('Failed to save metadata');
    }
  }
} 