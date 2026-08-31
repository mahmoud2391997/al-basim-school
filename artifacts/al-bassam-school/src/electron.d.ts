interface Window {
  alBassamDesktop?: {
    platform: string;
    isDesktop: boolean;
    apiBaseUrl: string;
    appVersion: string;
    backup: () => Promise<{ canceled: boolean; filePath?: string }>;
    restore: () => Promise<{ canceled: boolean }>;
    saveProfilePicture: (
      dataUrl: string,
    ) => Promise<{ ok: boolean; error?: string }>;
    loadProfilePicture: () => Promise<{
      ok: boolean;
      dataUrl?: string | null;
      error?: string;
    }>;
  };
}
