// Initialize config object
export const config = {
  github: {
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
    owner: 'vikram-twodesign',
    repo: 'midweave',
    branch: 'main'
  },
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  },
} as const;

// Validate GitHub configuration
export const validateGitHubConfig = () => {
  if (!config.github.token) {
    console.error('GitHub token is not configured. Please set NEXT_PUBLIC_GITHUB_TOKEN.');
    return false;
  }
  return true;
}; 