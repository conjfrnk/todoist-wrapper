import { z } from 'zod';

export const ThemeConfigSchema = z.object({
    autoToggleIntervalMinutes: z.number().int().min(1).max(1440).default(30),
    lightThemeStartHour: z.number().int().min(0).max(23).default(6),
    lightThemeEndHour: z.number().int().min(0).max(23).default(18),
    autoToggleEnabled: z.boolean().default(true)
});

export const WindowConfigSchema = z.object({
    defaultWidth: z.number().int().min(100).max(10000).default(1250),
    defaultHeight: z.number().int().min(100).max(10000).default(1000),
    minWidth: z.number().int().min(50).max(1000).default(100),
    maxWidth: z.number().int().min(1000).max(20000).default(10000),
    minHeight: z.number().int().min(50).max(1000).default(100),
    maxHeight: z.number().int().min(1000).max(20000).default(10000)
});

export const NetworkConfigSchema = z.object({
    maxRetries: z.number().int().min(1).max(10).default(3),
    retryBaseDelayMs: z.number().int().min(100).max(10000).default(1000),
    timeoutMs: z.number().int().min(1000).max(120000).default(30000)
});

export const StoreConfigSchema = z.object({
    name: z.string().min(1).default('todoist-wrapper-config'),
    schemaVersion: z.number().int().min(1).default(1)
});

export const AppConfigSchema = z.object({
    todoistUrl: z.string().url().default('https://app.todoist.com'),
    theme: ThemeConfigSchema.default({}),
    window: WindowConfigSchema.default({}),
    network: NetworkConfigSchema.default({}),
    store: StoreConfigSchema.default({}),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    nodeEnv: z.enum(['development', 'production', 'test']).default('production')
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type WindowConfig = z.infer<typeof WindowConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type StoreConfig = z.infer<typeof StoreConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

export const DEFAULT_CONFIG: AppConfig = AppConfigSchema.parse({});
