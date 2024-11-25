export const config = {
  github: {
    clientId: process.env.MW_CLIENT_ID,
    clientSecret: process.env.MW_CLIENT_SECRET,
    accessToken: process.env.MW_ACCESS_TOKEN,
    repository: process.env.NEXT_PUBLIC_REPOSITORY || 'midweave',
    branch: process.env.NEXT_PUBLIC_BRANCH || 'main',
  },
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'MW_CLIENT_ID',
  'MW_CLIENT_SECRET',
  'MW_ACCESS_TOKEN',
  'NEXT_PUBLIC_OPENAI_API_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
} 