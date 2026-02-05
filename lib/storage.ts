// SecureStore wrapper for type-safe storage operations
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    AUTH_USER: 'auth_user',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export const storage = {
    /**
     * Get a value from secure storage
     */
    async get(key: StorageKey): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error(`Error getting ${key} from storage:`, error);
            return null;
        }
    },

    /**
     * Set a value in secure storage
     */
    async set(key: StorageKey, value: string): Promise<boolean> {
        try {
            console.log(`Storage.set: key=${key}, valueType=${typeof value}, valuePreview=${value?.substring?.(0, 50)}`);
            if (value === undefined || value === null) {
                console.error(`Cannot save null/undefined value for key: ${key}`);
                return false;
            }
            await SecureStore.setItemAsync(key, value);
            return true;
        } catch (error) {
            console.error(`Error setting ${key} in storage:`, error);
            return false;
        }
    },

    /**
     * Remove a value from secure storage
     */
    async remove(key: StorageKey): Promise<boolean> {
        try {
            await SecureStore.deleteItemAsync(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from storage:`, error);
            return false;
        }
    },

    /**
     * Get the access token
     */
    async getToken(): Promise<string | null> {
        return this.get(STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Set the access token
     */
    async setToken(token: string): Promise<boolean> {
        return this.set(STORAGE_KEYS.ACCESS_TOKEN, token);
    },

    /**
     * Remove the access token
     */
    async removeToken(): Promise<boolean> {
        return this.remove(STORAGE_KEYS.ACCESS_TOKEN);
    },

    /**
     * Get the stored user data
     */
    async getUser<T>(): Promise<T | null> {
        const data = await this.get(STORAGE_KEYS.AUTH_USER);
        if (!data) return null;
        try {
            return JSON.parse(data) as T;
        } catch {
            return null;
        }
    },

    /**
     * Set the user data
     */
    async setUser<T>(user: T): Promise<boolean> {
        return this.set(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    },

    /**
     * Remove user data
     */
    async removeUser(): Promise<boolean> {
        return this.remove(STORAGE_KEYS.AUTH_USER);
    },

    /**
     * Clear all auth data
     */
    async clearAuth(): Promise<void> {
        await Promise.all([
            this.removeToken(),
            this.removeUser(),
        ]);
    },

    // Export keys for reference
    KEYS: STORAGE_KEYS,
};

export default storage;
