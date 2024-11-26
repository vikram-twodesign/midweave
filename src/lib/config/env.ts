// Helper to safely get environment variables
const getEnvVar = (key: string): string => {
  // For client-side
  if (typeof window !== 'undefined') {
    return process.env[key] || '';
  }
  // For server-side
  return process.env[key] || '';
};

// Environment configuration
export const env = {
  GITHUB_TOKEN: getEnvVar('NEXT_PUBLIC_GITHUB_TOKEN'),
  REPOSITORY: getEnvVar('NEXT_PUBLIC_REPOSITORY') || 'vikram-twodesign/midweave',
  BRANCH: getEnvVar('NEXT_PUBLIC_BRANCH') || 'main',
} as const;

// Validate required environment variables
export const validateEnv = () => {
  const required = ['NEXT_PUBLIC_GITHUB_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}; 