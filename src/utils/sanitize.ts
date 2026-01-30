/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"'/]/g, char => HTML_ENTITIES[char] ?? char);
}

/**
 * Sanitize a string for safe insertion into HTML
 */
export function sanitizeForHtml(input: unknown): string {
    if (input === null || input === undefined) {
        return '';
    }
    return escapeHtml(String(input));
}

/**
 * Validate that a URL is safe and well-formed
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Sanitize a URL for safe use (removes any potential injection)
 */
export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        // Return the normalized URL
        return parsed.href;
    } catch {
        return null;
    }
}

/**
 * Strip potentially dangerous protocols from a URL
 */
export function stripDangerousProtocols(url: string): string {
    const dangerous = /^(javascript|data|vbscript|file|about):/i;
    if (dangerous.test(url)) {
        return '';
    }
    return url;
}

/**
 * Validate hostname matches expected Todoist domains
 */
export function isTodoistDomain(url: string, configuredUrl: string): boolean {
    try {
        const parsedUrl = new URL(url);
        const configuredOrigin = new URL(configuredUrl).origin;
        return parsedUrl.origin === configuredOrigin;
    } catch {
        return false;
    }
}

/**
 * Sanitize error message for display
 */
export function sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return escapeHtml(error.message);
    }
    if (typeof error === 'string') {
        return escapeHtml(error);
    }
    return 'An unknown error occurred';
}
