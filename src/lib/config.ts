export const config = {
  github: {
    clientId: process.env.MW_CLIENT_ID,
    clientSecret: process.env.MW_CLIENT_SECRET,
    accessToken: process.env.NEXT_PUBLIC_MW_ACCESS_TOKEN,
    repository: process.env.NEXT_PUBLIC_REPOSITORY,
    branch: process.env.NEXT_PUBLIC_BRANCH || 'main',
  },
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_REPOSITORY',
  'NEXT_PUBLIC_MW_ACCESS_TOKEN',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
} 