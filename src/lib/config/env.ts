export const getEnvVar = (key: string): string => {
  // Check browser environment variables first
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key] as string;
  }
  
  // Then check process.env
  if (process.env[key]) {
    return process.env[key] as string;
  }

  return '';
};

export const env = {
  GITHUB_TOKEN: getEnvVar('NEXT_PUBLIC_GITHUB_TOKEN'),
  REPOSITORY: getEnvVar('NEXT_PUBLIC_REPOSITORY'),
  BRANCH: getEnvVar('NEXT_PUBLIC_BRANCH') || 'main',
}; 