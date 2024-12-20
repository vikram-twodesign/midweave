import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define application routes
export const routes = {
  home: '/',
  admin: '/admin',
  upload: '/admin/upload',
  edit: (id: string) => `/admin/edit/${id}`,
  view: (id: string) => `/view/${id}`,
  api: {
    images: '/api/images',
    entries: '/api/entries'
  }
} as const;
