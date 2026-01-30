import Store from 'electron-store';
import type {
    StoreData,
    WindowBounds,
    ThemeValue,
    StoreServiceInterface,
    StoreMigration
} from '../types/store.types.js';
import { getLogger } from './LoggerService.js';
import type { LoggerService } from './LoggerService.js';

/**
 * StoreService - Async electron-store wrapper with caching and fallback
 */
export class StoreService implements StoreServiceInterface {
    private store: Store<StoreData> | null = null;
    private memoryFallback: Map<string, unknown> = new Map();
    private cache: Map<keyof StoreData, StoreData[keyof StoreData]> = new Map();
    private writeQueue: Promise<void> = Promise.resolve();
    private logger: LoggerService;
    private healthy: boolean = true;
    private static instance: StoreService | null = null;
    private schemaVersion: number;

    private constructor(storeName: string, schemaVersion: number) {
        this.schemaVersion = schemaVersion;
        this.logger = getLogger('StoreService');
        this.initializeStore(storeName);
    }

    /**
     * Initialize singleton instance
     */
    public static initialize(storeName: string, schemaVersion: number): StoreService {
        if (!StoreService.instance) {
            StoreService.instance = new StoreService(storeName, schemaVersion);
        }
        return StoreService.instance;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): StoreService {
        if (!StoreService.instance) {
            throw new Error('StoreService not initialized. Call initialize() first.');
        }
        return StoreService.instance;
    }

    /**
     * Reset singleton (mainly for testing)
     */
    public static reset(): void {
        StoreService.instance = null;
    }

    /**
     * Initialize the underlying store with fallback handling
     */
    private initializeStore(storeName: string): void {
        try {
            this.store = new Store<StoreData>({
                name: storeName,
                clearInvalidConfig: true
            });

            // Run migrations if needed
            const currentVersion = this.store.get('schemaVersion', 0);
            if (currentVersion < this.schemaVersion) {
                this.logger.info('Running store migrations', {
                    from: currentVersion,
                    to: this.schemaVersion
                });
                this.runMigrations(currentVersion);
                this.store.set('schemaVersion', this.schemaVersion);
            }

            // Populate cache from disk
            this.populateCache();
            this.logger.info('Store initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize store', error);
            this.attemptRecovery(storeName);
        }
    }

    /**
     * Attempt to recover from store initialization failure
     */
    private attemptRecovery(storeName: string): void {
        try {
            this.logger.warn('Attempting store recovery by clearing corrupted data');
            this.store = new Store<StoreData>({
                name: storeName,
                clearInvalidConfig: true
            });
            this.store.clear();
            this.store.set('schemaVersion', this.schemaVersion);
            this.logger.info('Store recovered successfully');
        } catch (recoveryError) {
            this.logger.error('Store recovery failed, using in-memory fallback', recoveryError);
            this.healthy = false;
            this.store = null;
        }
    }

    /**
     * Populate in-memory cache from store
     */
    private populateCache(): void {
        if (!this.store) return;

        try {
            const keys: (keyof StoreData)[] = ['schemaVersion', 'windowBounds', 'theme'];
            for (const key of keys) {
                const value = this.store.get(key);
                if (value !== undefined) {
                    this.cache.set(key, value);
                }
            }
        } catch (error) {
            this.logger.error('Failed to populate cache', error);
        }
    }

    /**
     * Run migrations from a given version
     */
    private runMigrations(fromVersion: number): void {
        const migrations = this.getMigrations();

        for (const migration of migrations) {
            if (fromVersion < migration.version) {
                this.logger.info(`Running migration: v${fromVersion} -> v${migration.version}`);
                try {
                    if (this.store) {
                        const data = this.store.store;
                        const migrated = migration.migrate(data);
                        Object.entries(migrated).forEach(([key, value]) => {
                            this.store?.set(
                                key as keyof StoreData,
                                value as StoreData[keyof StoreData]
                            );
                        });
                    }
                } catch (error) {
                    this.logger.error(`Migration to v${migration.version} failed`, error);
                }
            }
        }
    }

    /**
     * Get list of migrations
     */
    private getMigrations(): StoreMigration[] {
        return [
            {
                version: 1,
                migrate: data => {
                    // Initial version - no structural changes
                    return data;
                }
            }
        ];
    }

    /**
     * Get a value from the store (cached)
     */
    public get<K extends keyof StoreData>(key: K): StoreData[K] | undefined;
    public get<K extends keyof StoreData>(key: K, defaultValue: StoreData[K]): StoreData[K];
    public get<K extends keyof StoreData>(
        key: K,
        defaultValue?: StoreData[K]
    ): StoreData[K] | undefined {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key) as StoreData[K];
        }

        // Try store
        if (this.store) {
            try {
                // Use type assertion to work around electron-store's complex types
                const storeAny = this.store as {
                    get(key: string, defaultValue?: unknown): unknown;
                };
                const value =
                    defaultValue !== undefined
                        ? storeAny.get(key, defaultValue)
                        : storeAny.get(key);
                if (value !== undefined) {
                    this.cache.set(key, value as StoreData[K]);
                }
                return value as StoreData[K] | undefined;
            } catch (error) {
                this.logger.error(`Failed to get key: ${key}`, error);
            }
        }

        // Try memory fallback
        if (this.memoryFallback.has(key)) {
            return this.memoryFallback.get(key) as StoreData[K];
        }

        return defaultValue;
    }

    /**
     * Set a value in the store (async, queued)
     */
    public async set<K extends keyof StoreData>(key: K, value: StoreData[K]): Promise<boolean> {
        // Update cache immediately
        this.cache.set(key, value);

        // Queue the disk write
        this.writeQueue = this.writeQueue
            .then(async () => {
                try {
                    if (this.store) {
                        this.store.set(key, value);
                    } else {
                        this.memoryFallback.set(key, value);
                    }
                } catch (error) {
                    this.logger.error(`Failed to write key: ${key}`, error);
                    // Fallback to memory
                    this.memoryFallback.set(key, value);
                }
            })
            .catch(error => {
                this.logger.error('Store write queue error', error);
            });

        return true;
    }

    /**
     * Clear all store data
     */
    public clear(): void {
        try {
            this.cache.clear();
            this.memoryFallback.clear();
            if (this.store) {
                this.store.clear();
            }
            this.logger.info('Store cleared');
        } catch (error) {
            this.logger.error('Failed to clear store', error);
        }
    }

    /**
     * Get current schema version
     */
    public getSchemaVersion(): number {
        return this.get('schemaVersion', this.schemaVersion);
    }

    /**
     * Check if store is healthy (using disk, not fallback)
     */
    public isHealthy(): boolean {
        return this.healthy && this.store !== null;
    }

    /**
     * Wait for all pending writes to complete
     */
    public async flush(): Promise<void> {
        await this.writeQueue;
    }

    // Convenience methods for common operations

    /**
     * Get window bounds
     */
    public getWindowBounds(): WindowBounds | undefined {
        return this.get('windowBounds');
    }

    /**
     * Set window bounds
     */
    public async setWindowBounds(bounds: WindowBounds): Promise<boolean> {
        return this.set('windowBounds', bounds);
    }

    /**
     * Get theme
     */
    public getTheme(): ThemeValue {
        return this.get('theme', 'system');
    }

    /**
     * Set theme
     */
    public async setTheme(theme: ThemeValue): Promise<boolean> {
        return this.set('theme', theme);
    }
}

// Export singleton getter for convenience
export function getStore(): StoreService {
    return StoreService.getInstance();
}
