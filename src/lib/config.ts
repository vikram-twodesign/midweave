// Initialize config object
const getEnvVar = (key: string, defaultValue: string = '') => {
  if (typeof window !== 'undefined' && window.__ENV__) {
    return window.__ENV__[key] || process.env[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

export const config = {
  github: {
    token: getEnvVar('NEXT_PUBLIC_GITHUB_TOKEN'),
    owner: 'vikram-twodesign',
    repo: 'midweave',
    branch: 'main'
  },
  openai: {
    apiKey: getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY'),
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