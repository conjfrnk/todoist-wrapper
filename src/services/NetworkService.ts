import type { BrowserWindow } from 'electron';
import type {
    NetworkServiceConfig,
    CircuitBreakerState,
    LoadResult,
    NetworkServiceInterface
} from '../types/network.types.js';
import { DEFAULT_NETWORK_CONFIG } from '../types/network.types.js';
import { getLogger } from './LoggerService.js';
import type { LoggerService } from './LoggerService.js';
import { sanitizeErrorMessage } from '../utils/sanitize.js';

/**
 * NetworkService - URL loading with retry logic and circuit breaker pattern
 */
export class NetworkService implements NetworkServiceInterface {
    private config: NetworkServiceConfig;
    private logger: LoggerService;
    private circuitBreaker: CircuitBreakerState;
    private static instance: NetworkService | null = null;

    private constructor(config: Partial<NetworkServiceConfig> = {}) {
        this.logger = getLogger('NetworkService');
        this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
        this.circuitBreaker = {
            failures: 0,
            lastFailure: null,
            isOpen: false
        };
    }

    /**
     * Initialize singleton instance
     */
    public static initialize(config?: Partial<NetworkServiceConfig>): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService(config);
        }
        return NetworkService.instance;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            return NetworkService.initialize();
        }
        return NetworkService.instance;
    }

    /**
     * Reset singleton (mainly for testing)
     */
    public static reset(): void {
        NetworkService.instance = null;
    }

    /**
     * Load URL into a BrowserWindow with retry logic
     */
    public async loadUrl(url: string, window?: BrowserWindow): Promise<LoadResult> {
        // Check circuit breaker
        if (this.isCircuitOpen()) {
            this.logger.warn('Circuit breaker is open, request blocked', { url });
            return {
                success: false,
                attempts: 0,
                error: new Error('Circuit breaker is open')
            };
        }

        const result = await this.loadWithRetry(url, window);

        if (!result.success) {
            this.recordFailure();
        } else {
            this.recordSuccess();
        }

        return result;
    }

    /**
     * Internal retry logic
     */
    private async loadWithRetry(url: string, window?: BrowserWindow): Promise<LoadResult> {
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                this.logger.info('Loading URL', {
                    url,
                    attempt,
                    maxRetries: this.config.maxRetries
                });

                if (window) {
                    await window.loadURL(url);
                }

                this.logger.info('URL loaded successfully', { url, attempt });
                return { success: true, attempts: attempt };
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.logger.error('Failed to load URL', err, { url, attempt });

                if (attempt === this.config.maxRetries) {
                    return { success: false, attempts: attempt, error: err };
                }

                // Exponential backoff
                const delay = this.config.retryBaseDelayMs * attempt;
                this.logger.info('Retrying after delay', { delay, nextAttempt: attempt + 1 });
                await this.sleep(delay);
            }
        }

        return {
            success: false,
            attempts: this.config.maxRetries,
            error: new Error('All retry attempts exhausted')
        };
    }

    /**
     * Check if circuit breaker is open
     */
    public isCircuitOpen(): boolean {
        if (!this.circuitBreaker.isOpen) {
            return false;
        }

        // Check if enough time has passed to try again
        if (this.circuitBreaker.lastFailure) {
            const elapsed = Date.now() - this.circuitBreaker.lastFailure;
            if (elapsed >= this.config.circuitBreakerResetMs) {
                this.logger.info('Circuit breaker reset, allowing requests');
                this.circuitBreaker.isOpen = false;
                this.circuitBreaker.failures = 0;
                return false;
            }
        }

        return true;
    }

    /**
     * Manually reset the circuit breaker
     */
    public resetCircuit(): void {
        this.circuitBreaker = {
            failures: 0,
            lastFailure: null,
            isOpen: false
        };
        this.logger.info('Circuit breaker manually reset');
    }

    /**
     * Record a failure for circuit breaker
     */
    private recordFailure(): void {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailure = Date.now();

        if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
            this.circuitBreaker.isOpen = true;
            this.logger.warn('Circuit breaker opened', {
                failures: this.circuitBreaker.failures,
                threshold: this.config.circuitBreakerThreshold
            });
        }
    }

    /**
     * Record a success for circuit breaker
     */
    private recordSuccess(): void {
        if (this.circuitBreaker.failures > 0) {
            this.circuitBreaker.failures = 0;
            this.logger.debug('Circuit breaker failure count reset');
        }
    }

    /**
     * Get error page HTML (lazy loaded)
     */
    public getErrorPageHtml(error: Error, targetUrl: string): string {
        const sanitizedError = sanitizeErrorMessage(error);
        const sanitizedUrl = targetUrl.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return `<!DOCTYPE html>
<html>
<head>
    <title>Connection Error - Todoist</title>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 48px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 16px; }
        .message { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .error-detail {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            color: #888;
            margin-bottom: 24px;
            word-break: break-word;
        }
        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .status.offline { background: #fee2e2; color: #dc2626; }
        .status.online { background: #dcfce7; color: #16a34a; }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 14px 32px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
        button:active { transform: translateY(0); }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading .spinner { display: inline-block; }
        .loading button { padding-left: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">&#x1F50C;</div>
        <h1>Unable to connect to Todoist</h1>
        <div id="status" class="status offline">
            <span class="status-dot"></span>
            <span id="status-text">Checking connection...</span>
        </div>
        <p class="message">
            We couldn't reach Todoist. This might be due to a network issue or the service may be temporarily unavailable.
        </p>
        <div class="error-detail">${sanitizedError}</div>
        <div id="btn-container">
            <button onclick="retry()" id="retry-btn">
                <span class="spinner"></span>
                Try Again
            </button>
        </div>
    </div>
    <script>
        const targetUrl = '${sanitizedUrl}';
        const statusEl = document.getElementById('status');
        const statusText = document.getElementById('status-text');
        const retryBtn = document.getElementById('retry-btn');
        const btnContainer = document.getElementById('btn-container');

        function updateStatus() {
            const online = navigator.onLine;
            statusEl.className = 'status ' + (online ? 'online' : 'offline');
            statusText.textContent = online ? 'Internet connected' : 'No internet connection';
        }

        function retry() {
            btnContainer.classList.add('loading');
            retryBtn.disabled = true;
            window.location.href = targetUrl;
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();

        // Auto-retry when connection is restored
        window.addEventListener('online', () => {
            setTimeout(retry, 1000);
        });
    </script>
</body>
</html>`;
    }

    /**
     * Get error page as data URL for loading into window
     */
    public getErrorPageDataUrl(error: Error, targetUrl: string): string {
        const html = this.getErrorPageHtml(error, targetUrl);
        return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    }

    /**
     * Load error page into window
     */
    public async loadErrorPage(
        window: BrowserWindow,
        error: Error,
        targetUrl: string
    ): Promise<void> {
        const dataUrl = this.getErrorPageDataUrl(error, targetUrl);
        await window.loadURL(dataUrl);
    }

    /**
     * Utility sleep function
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get circuit breaker state (for monitoring)
     */
    public getCircuitState(): CircuitBreakerState {
        return { ...this.circuitBreaker };
    }
}

// Export singleton getter for convenience
export function getNetwork(): NetworkService {
    return NetworkService.getInstance();
}
