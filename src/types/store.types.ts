import { z } from 'zod';

export const WindowBoundsSchema = z.object({
    width: z.number().int().min(100).max(10000),
    height: z.number().int().min(100).max(10000),
    x: z.number().int().optional(),
    y: z.number().int().optional()
});

export const ThemeValueSchema = z.enum(['light', 'dark', 'system']);

export const StoreDataSchema = z.object({
    schemaVersion: z.number().int().default(1),
    windowBounds: WindowBoundsSchema.optional(),
    theme: ThemeValueSchema.default('system')
});

export type WindowBounds = z.infer<typeof WindowBoundsSchema>;
export type ThemeValue = z.infer<typeof ThemeValueSchema>;
export type StoreData = z.infer<typeof StoreDataSchema>;

export interface StoreServiceInterface {
    get<K extends keyof StoreData>(key: K): StoreData[K] | undefined;
    get<K extends keyof StoreData>(key: K, defaultValue: StoreData[K]): StoreData[K];
    set<K extends keyof StoreData>(key: K, value: StoreData[K]): Promise<boolean>;
    clear(): void;
    getSchemaVersion(): number;
    isHealthy(): boolean;
}

export interface StoreMigration {
    version: number;
    migrate: (data: Partial<StoreData>) => Partial<StoreData>;
}
