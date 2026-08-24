interface Window {
  alBassamDesktop?: {
    platform: string;
    isDesktop: boolean;
    apiBaseUrl: string;
    appVersion: string;
    backup: () => Promise<{ canceled: boolean; filePath?: string }>;
    restore: () => Promise<{ canceled: boolean }>;
  };
}
