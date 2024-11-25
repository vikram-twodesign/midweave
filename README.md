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

2. Create `.env.local` file with required environment variables.

3. Run the development server:
```bash
npm run dev
```

## License

MIT License - See LICENSE file for details
