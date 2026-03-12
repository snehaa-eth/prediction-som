import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Storage } from '@reown/appkit-react-native';

function safeJsonParse<T>(value: string): T {
  try {
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined as T;
  }
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export const appKitStorage: Storage = {
  getKeys: async () => (await AsyncStorage.getAllKeys()) as string[],
  getEntries: async <T = unknown>() => {
    const keys = await AsyncStorage.getAllKeys();
    return Promise.all(
      keys.map(async (key) => [key, safeJsonParse<T>(await AsyncStorage.getItem(key)) ?? null] as [string, T])
    );
  },
  getItem: async <T = unknown>(key: string) => {
    const item = await AsyncStorage.getItem(key);
    return (item != null ? safeJsonParse<T>(item) : undefined) as T | undefined;
  },
  setItem: async <T = unknown>(key: string, value: T) => {
    await AsyncStorage.setItem(key, safeJsonStringify(value));
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};
