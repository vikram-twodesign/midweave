const getEnvVar = (key: string, required: boolean = false): string => {
  let value = '';

  // In browser, check window.__ENV__ first
  if (typeof window !== 'undefined') {
    if (window.__ENV__ && window.__ENV__[key]) {
      value = window.__ENV__[key] as string;
    }
  } else {
    // In Node.js environment, use process.env
    if (process.env[key]) {
      value = process.env[key] as string;
    }
  }

  if (required && !value) {
    console.error(`Required environment variable ${key} is not configured`);
  }

  return value;
};

// Debug environment variables in development
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Variables:', {
    GITHUB_TOKEN: '[SECRET]',
    REPOSITORY: getEnvVar('NEXT_PUBLIC_REPOSITORY'),
    BRANCH: getEnvVar('NEXT_PUBLIC_BRANCH'),
  });
}

export const env = {
  GITHUB_TOKEN: getEnvVar('NEXT_PUBLIC_GITHUB_TOKEN', true),
  REPOSITORY: getEnvVar('NEXT_PUBLIC_REPOSITORY') || 'vikram-twodesign/midweave',
  BRANCH: getEnvVar('NEXT_PUBLIC_BRANCH') || 'main',
}; 