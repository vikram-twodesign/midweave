export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If the source is already a full URL, return it as is
  if (src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }
  
  // For local images, prepend the base path in production
  const baseUrl = process.env.NODE_ENV === 'production' ? '/midweave' : '';
  return `${baseUrl}${src}`;
} 