const getEnvVar = (key: string, required: boolean = false): string => {
  let value = '';

  // Check browser environment variables first
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    value = window.__ENV__[key] as string;
  }
  
  // Then check process.env
  if (!value && process.env[key]) {
    value = process.env[key] as string;
  }

  if (required && !value) {
    console.error(`Required environment variable ${key} is not configured`);
  }

  return value;
};

export const env = {
  GITHUB_TOKEN: getEnvVar('NEXT_PUBLIC_GITHUB_TOKEN', true),
  REPOSITORY: getEnvVar('NEXT_PUBLIC_REPOSITORY') || 'vikram-twodesign/midweave',
  BRANCH: getEnvVar('NEXT_PUBLIC_BRANCH') || 'main',
}; 