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