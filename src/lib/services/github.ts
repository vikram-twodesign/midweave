import { config } from '@/lib/config';

export class GitHubService {
  private baseUrl = 'https://api.github.com';
  private owner: string;
  private repo: string;

  constructor() {
    const [owner, repo] = (process.env.NEXT_PUBLIC_REPOSITORY || 'owner/repo').split('/');
    this.owner = owner;
    this.repo = repo;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${process.env.MW_ACCESS_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response;
  }

  async uploadImage(file: File, path: string): Promise<string> {
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

    // Get current commit SHA
    const refResponse = await this.request(
      `/repos/${this.owner}/${this.repo}/git/refs/heads/main`
    );
    const refData = await refResponse.json();
    const latestCommitSha = refData.object.sha;

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

    // Return the raw URL for the image
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${path}`;
  }

  async saveMetadata(data: any, path: string): Promise<void> {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    try {
      // Try to get existing file first
      const existingFile = await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`
      ).then(res => res.json()).catch(() => null);

      const method = existingFile ? 'PUT' : 'PUT';
      const body: any = {
        message: `Update metadata: ${path}`,
        content,
        branch: 'main',
      };

      if (existingFile) {
        body.sha = existingFile.sha;
      }

      await this.request(
        `/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method,
          body: JSON.stringify(body)
        }
      );
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw new Error('Failed to save metadata');
    }
  }
} 