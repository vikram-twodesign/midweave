# Midweave Gallery

A curated Midjourney style library for managing and showcasing AI-generated artwork.

## Features

- Upload and manage Midjourney images
- AI-powered image analysis
- Style categorization and tagging
- Searchable parameter library
- Responsive gallery view

## Directory Structure

```
/midweave
  ├── /public           # Public assets
  ├── /src             # Source code
  ├── /data            # JSON data files
  │   ├── entries.json # Gallery entries metadata
  │   └── index.json   # Gallery index and stats
  └── /images          # Image storage
      ├── /originals   # Original uploaded images
      └── /thumbnails  # Generated thumbnails
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file with required environment variables:
```
NEXT_PUBLIC_REPOSITORY=your-username/your-repo
NEXT_PUBLIC_MW_ACCESS_TOKEN=your-github-token
NEXT_PUBLIC_BRANCH=main
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
```

3. Run the development server:
```bash
npm run dev
```

## Deployment

The app is automatically deployed to GitHub Pages when changes are pushed to the main branch. To deploy manually:

1. Set up GitHub repository secrets (see above environment variables)
2. Push changes to the main branch
3. GitHub Actions will build and deploy automatically
4. Visit your GitHub Pages URL to see the deployed app

## License

MIT License - See LICENSE file for details
