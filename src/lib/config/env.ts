// Environment configuration
export const env = {
  GITHUB_TOKEN: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
  REPOSITORY: process.env.NEXT_PUBLIC_REPOSITORY || 'vikram-twodesign/midweave',
  BRANCH: process.env.NEXT_PUBLIC_BRANCH || 'main',
} as const;

// Validate environment configuration
export const validateEnv = () => {
  if (!env.GITHUB_TOKEN) {
    console.error('GitHub token is not configured. Please set NEXT_PUBLIC_GITHUB_TOKEN.');
    return false;
  }

  if (!env.REPOSITORY) {
    console.error('Repository is not configured. Please set NEXT_PUBLIC_REPOSITORY.');
    return false;
  }

  return true;
}; 