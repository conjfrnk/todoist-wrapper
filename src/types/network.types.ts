export interface NetworkServiceConfig {
    maxRetries: number;
    retryBaseDelayMs: number;
    timeoutMs: number;
    circuitBreakerThreshold: number;
    circuitBreakerResetMs: number;
}

export interface CircuitBreakerState {
    failures: number;
    lastFailure: number | null;
    isOpen: boolean;
}

export interface LoadResult {
    success: boolean;
    attempts: number;
    error?: Error;
}

export interface NetworkServiceInterface {
    loadUrl(url: string): Promise<LoadResult>;
    isCircuitOpen(): boolean;
    resetCircuit(): void;
    getErrorPageHtml(error: Error, targetUrl: string): string;
}

export const DEFAULT_NETWORK_CONFIG: NetworkServiceConfig = {
    maxRetries: 3,
    retryBaseDelayMs: 1000,
    timeoutMs: 30000,
    circuitBreakerThreshold: 5,
    circuitBreakerResetMs: 60000
};
