import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const WEB_KEY = "al-bassam:admin-profile-picture";

async function nativeLoad(): Promise<string | null> {
  const desktop = window.alBassamDesktop;
  if (desktop?.loadProfilePicture) {
    try {
      const res = await desktop.loadProfilePicture();
      if (res.ok && res.dataUrl) return res.dataUrl;
    } catch {
      // ignore native errors and fall back to session
    }
    return null;
  }
  try {
    return window.sessionStorage.getItem(WEB_KEY);
  } catch {
    return null;
  }
}

async function nativeSave(dataUrl: string): Promise<boolean> {
  const desktop = window.alBassamDesktop;
  if (desktop?.saveProfilePicture) {
    try {
      const res = await desktop.saveProfilePicture(dataUrl);
      return res.ok === true;
    } catch {
      return false;
    }
  }
  try {
    window.sessionStorage.setItem(WEB_KEY, dataUrl);
    return true;
  } catch {
    return false;
  }
}

async function nativeClear(): Promise<boolean> {
  const desktop = window.alBassamDesktop;
  if (desktop?.saveProfilePicture) {
    try {
      const res = await desktop.saveProfilePicture("");
      return res.ok === true;
    } catch {
      return false;
    }
  }
  try {
    window.sessionStorage.removeItem(WEB_KEY);
    return true;
  } catch {
    return false;
  }
}

interface ProfilePictureContextValue {
  profilePicture: string | null;
  isDesktop: boolean;
  setProfilePicture: (dataUrl: string) => Promise<boolean>;
  clearProfilePicture: () => Promise<boolean>;
}

const ProfilePictureContext = createContext<ProfilePictureContextValue>({
  profilePicture: null,
  isDesktop: false,
  setProfilePicture: async () => false,
  clearProfilePicture: async () => false,
});

export function ProfilePictureProvider({ children }: { children: ReactNode }) {
  const [profilePicture, setPicture] = useState<string | null>(null);
  const isDesktop = Boolean(window.alBassamDesktop?.isDesktop);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const value = await nativeLoad();
      if (!cancelled) setPicture(value);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setProfilePicture = async (dataUrl: string) => {
    const ok = await nativeSave(dataUrl);
    if (ok) setPicture(dataUrl);
    return ok;
  };

  const clearProfilePicture = async () => {
    const ok = await nativeClear();
    if (ok) setPicture(null);
    return ok;
  };

  return (
    <ProfilePictureContext.Provider
      value={{
        profilePicture,
        isDesktop,
        setProfilePicture,
        clearProfilePicture,
      }}
    >
      {children}
    </ProfilePictureContext.Provider>
  );
}

export function useProfilePicture() {
  return useContext(ProfilePictureContext);
}
