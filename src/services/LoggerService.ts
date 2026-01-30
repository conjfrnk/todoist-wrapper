import pino from 'pino';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import type { LogLevel, LoggerServiceInterface, LoggerConfig } from '../types/logger.types.js';

/**
 * LoggerService - Pino-based structured logging with file rotation
 */
export class LoggerService implements LoggerServiceInterface {
    private logger: pino.Logger;
    private context: string;
    private static instance: LoggerService | null = null;
    private static config: LoggerConfig;

    private constructor(parentLogger?: pino.Logger, context?: string) {
        this.context = context ?? 'main';

        if (parentLogger) {
            this.logger = parentLogger.child({ context: this.context });
        } else {
            this.logger = this.createLogger();
        }
    }

    /**
     * Initialize the logger service with configuration
     */
    public static initialize(config: Partial<LoggerConfig> = {}): LoggerService {
        const defaultLogDir = LoggerService.getDefaultLogDir();

        LoggerService.config = {
            level: config.level ?? 'info',
            logDir: config.logDir ?? defaultLogDir,
            maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
            maxFiles: config.maxFiles ?? 5,
            enableConsole: config.enableConsole ?? true,
            enableFile: config.enableFile ?? true
        };

        LoggerService.instance = new LoggerService();
        return LoggerService.instance;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            // Initialize with defaults if not already initialized
            return LoggerService.initialize();
        }
        return LoggerService.instance;
    }

    /**
     * Reset singleton (mainly for testing)
     */
    public static reset(): void {
        LoggerService.instance = null;
    }

    /**
     * Get default log directory
     */
    private static getDefaultLogDir(): string {
        try {
            // app.getPath may not be available during testing
            return app.getPath('logs');
        } catch {
            return process.cwd();
        }
    }

    /**
     * Create the Pino logger instance
     */
    private createLogger(): pino.Logger {
        const config = LoggerService.config;
        const targets: pino.TransportTargetOptions[] = [];

        // Console transport
        if (config.enableConsole) {
            targets.push({
                target: 'pino/file',
                options: { destination: 1 }, // stdout
                level: config.level
            });
        }

        // File transport with rotation
        if (config.enableFile && config.logDir) {
            this.ensureLogDir(config.logDir);
            const logFile = path.join(config.logDir, 'todoist-wrapper.log');

            targets.push({
                target: 'pino/file',
                options: { destination: logFile },
                level: config.level
            });
        }

        const transport =
            targets.length > 0
                ? pino.transport({
                      targets
                  })
                : undefined;

        return pino(
            {
                level: config.level,
                timestamp: pino.stdTimeFunctions.isoTime,
                formatters: {
                    level: label => ({ level: label })
                },
                base: {
                    pid: process.pid,
                    app: 'todoist-wrapper'
                }
            },
            transport
        );
    }

    /**
     * Ensure log directory exists
     */
    private ensureLogDir(logDir: string): void {
        try {
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    /**
     * Log debug message
     */
    public debug(message: string, data?: Record<string, unknown>): void {
        this.logger.debug(data ?? {}, message);
    }

    /**
     * Log info message
     */
    public info(message: string, data?: Record<string, unknown>): void {
        this.logger.info(data ?? {}, message);
    }

    /**
     * Log warning message
     */
    public warn(message: string, data?: Record<string, unknown>): void {
        this.logger.warn(data ?? {}, message);
    }

    /**
     * Log error message
     */
    public error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
        const errorData: Record<string, unknown> = { ...data };

        if (error instanceof Error) {
            errorData.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        } else if (error !== undefined) {
            errorData.error = error;
        }

        this.logger.error(errorData, message);
    }

    /**
     * Create a child logger with context
     */
    public child(context: string): LoggerService {
        const childLogger = new LoggerService(this.logger, context);
        return childLogger;
    }

    /**
     * Set log level dynamically
     */
    public setLevel(level: LogLevel): void {
        this.logger.level = level;
    }

    /**
     * Flush logs (for graceful shutdown)
     */
    public async flush(): Promise<void> {
        return new Promise(resolve => {
            this.logger.flush();
            // Give some time for async writes
            setTimeout(resolve, 100);
        });
    }

    /**
     * Log performance metric
     */
    public metric(name: string, value: number, unit: string = 'ms'): void {
        this.logger.info({ metric: { name, value, unit } }, `Performance metric: ${name}`);
    }

    /**
     * Log startup information
     */
    public logStartup(startTime: number): void {
        const duration = Date.now() - startTime;
        this.info('Application started', {
            startupTimeMs: duration,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        });
    }

    /**
     * Log memory usage
     */
    public logMemory(): void {
        const usage = process.memoryUsage();
        this.debug('Memory usage', {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
            unit: 'MB'
        });
    }
}

// Export singleton getter for convenience
export function getLogger(context?: string): LoggerService {
    const instance = LoggerService.getInstance();
    return context ? instance.child(context) : instance;
}
