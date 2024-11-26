interface Window {
  __ENV__?: {
    NEXT_PUBLIC_GITHUB_TOKEN?: string;
    NEXT_PUBLIC_REPOSITORY?: string;
    NEXT_PUBLIC_BRANCH?: string;
    [key: string]: string | undefined;
  };
}

export {}; 