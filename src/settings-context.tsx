import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AppSettings } from "@/types";
import { defaultSettings } from "@/types";
import { getBackend } from "@/backend";

const SettingsContext = createContext<AppSettings>(defaultSettings);
const SettingsRefreshContext = createContext<() => Promise<void>>(async () => {});
const SettingsUpdateContext = createContext<
  (settings: AppSettings) => Promise<void>
>(async () => {});

export function useSettings(): AppSettings {
  return useContext(SettingsContext);
}

export function useSettingsRefresh(): () => Promise<void> {
  return useContext(SettingsRefreshContext);
}

export function useSettingsUpdate(): (
  settings: AppSettings,
) => Promise<void> {
  return useContext(SettingsUpdateContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const refresh = useCallback(async () => {
    const backend = getBackend();
    const saved = await backend.settings.get();
    if (saved) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, []);

  const update = useCallback(
    async (newSettings: AppSettings) => {
      const backend = getBackend();
      await backend.settings.save(newSettings);
      setSettings(newSettings);
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SettingsContext.Provider value={settings}>
      <SettingsRefreshContext.Provider value={refresh}>
        <SettingsUpdateContext.Provider value={update}>
          {children}
        </SettingsUpdateContext.Provider>
      </SettingsRefreshContext.Provider>
    </SettingsContext.Provider>
  );
}
