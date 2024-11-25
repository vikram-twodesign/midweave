// Check if we're in the browser environment
const isBrowser = typeof window !== 'undefined';

// Helper function to safely access environment variables
const getEnvVar = (key: string, fallback?: string): string => {
  let value = '';
  
  // Try to get from window.__ENV__ in browser
  if (isBrowser) {
    try {
      const envObj = (window as any).__ENV__;
      if (envObj && typeof envObj[key] === 'string') {
        value = envObj[key];
      }
    } catch (e) {
      console.warn('Failed to access window.__ENV__:', e);
    }
  }
  
  // If not found in window.__ENV__, try process.env
  if (!value && process.env[key]) {
    value = process.env[key] as string;
  }
  
  // Use fallback if provided and no value found
  if (!value && fallback !== undefined) {
    value = fallback;
  }
  
  return value;
};

// Initialize config object
export const config = {
  github: {
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
    owner: 'vikram-twodesign',
    repo: 'midweave',
    branch: 'main'
  },
  openai: {
    apiKey: getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY'),
  },
} as const;

// Debug environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Variables Debug:', {
    NEXT_PUBLIC_REPOSITORY: getEnvVar('NEXT_PUBLIC_REPOSITORY'),
    NEXT_PUBLIC_MW_ACCESS_TOKEN: getEnvVar('NEXT_PUBLIC_MW_ACCESS_TOKEN') ? '[PRESENT]' : '[MISSING]',
    NEXT_PUBLIC_BRANCH: getEnvVar('NEXT_PUBLIC_BRANCH'),
    NODE_ENV: process.env.NODE_ENV,
    MW_CLIENT_ID: getEnvVar('MW_CLIENT_ID') ? '[PRESENT]' : '[MISSING]',
    MW_CLIENT_SECRET: getEnvVar('MW_CLIENT_SECRET') ? '[PRESENT]' : '[MISSING]',
    isBrowser,
  });
}

// Validate required environment variables with better error handling
const requiredEnvVars = [
  'NEXT_PUBLIC_REPOSITORY',
  'NEXT_PUBLIC_MW_ACCESS_TOKEN',
] as const;

// Only validate if we're not in the browser or if window.__ENV__ is available
if (!isBrowser || (window as any).__ENV__) {
  for (const envVar of requiredEnvVars) {
    const value = getEnvVar(envVar);
    if (!value) {
      const errorMessage = `Missing required environment variable: ${envVar}. Please ensure it is properly set in your .env.local file.`;
      console.error(errorMessage);
      console.error('Current environment:', process.env.NODE_ENV);
      console.error('Is Browser:', isBrowser);
      if (isBrowser) {
        console.error('window.__ENV__ available:', Boolean((window as any).__ENV__));
      }
      throw new Error(errorMessage);
    }
  }
} 