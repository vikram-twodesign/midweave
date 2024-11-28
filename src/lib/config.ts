// Initialize config object
const getEnvVar = (key: string, defaultValue: string = '') => {
  if (typeof window !== 'undefined' && (window as any).env) {
    return (window as any).env[key] || process.env[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  github: {
    token: getEnvVar('NEXT_PUBLIC_GITHUB_TOKEN'),
    owner: getEnvVar('NEXT_PUBLIC_REPOSITORY', '').split('/')[0] || '',
    repo: getEnvVar('NEXT_PUBLIC_REPOSITORY', '').split('/')[1] || '',
    branch: getEnvVar('NEXT_PUBLIC_BRANCH', 'main'),
    accessToken: getEnvVar('NEXT_PUBLIC_MW_ACCESS_TOKEN')
  },
  openai: {
    apiKey: getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY'),
  },
  auth: {
    clientId: getEnvVar('MW_CLIENT_ID'),
    clientSecret: getEnvVar('MW_CLIENT_SECRET')
  }
} as const;

// Validate configuration
export const validateConfig = () => {
  const errors: string[] = [];

  // GitHub validation
  if (!config.github.token) {
    errors.push('GitHub token is not configured (NEXT_PUBLIC_GITHUB_TOKEN)');
  }
  if (!config.github.owner || !config.github.repo) {
    errors.push('GitHub repository is not configured (NEXT_PUBLIC_REPOSITORY)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 