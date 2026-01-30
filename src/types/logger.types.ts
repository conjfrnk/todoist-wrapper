export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    timestamp: string;
    message: string;
    context?: string;
    data?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
}

export interface LoggerServiceInterface {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void;
    child(context: string): LoggerServiceInterface;
    setLevel(level: LogLevel): void;
    flush(): Promise<void>;
}

export interface LoggerConfig {
    level: LogLevel;
    logDir: string;
    maxFileSize: number;
    maxFiles: number;
    enableConsole: boolean;
    enableFile: boolean;
}

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
    level: 'info',
    logDir: '',
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
    enableConsole: true,
    enableFile: true
};
