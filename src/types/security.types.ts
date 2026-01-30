export interface CSPDirectives {
    'default-src': string[];
    'script-src': string[];
    'style-src': string[];
    'img-src': string[];
    'connect-src': string[];
    'frame-src': string[];
    'object-src': string[];
    'font-src'?: string[];
    'media-src'?: string[];
}

export interface SecurityConfig {
    allowedProtocols: string[];
    blockedPatterns: RegExp[];
    allowedPermissions: string[];
    todoistDomains: string[];
}

export interface SecurityServiceInterface {
    generateCSP(): string;
    isUrlSafe(url: string): boolean;
    isSafeForExternalOpen(url: string): boolean;
    sanitizeHtml(html: string): string;
    validateCertificate(hostname: string, certificate: Electron.Certificate): boolean;
    isPermissionAllowed(permission: string): boolean;
}

export interface SecurityAuditEvent {
    type: 'permission_denied' | 'url_blocked' | 'certificate_error' | 'csp_violation';
    timestamp: string;
    details: Record<string, unknown>;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    allowedProtocols: ['https:', 'http:'],
    blockedPatterns: [/^javascript:/i, /^data:/i, /^file:/i, /^about:/i],
    allowedPermissions: ['notifications'],
    todoistDomains: ['todoist.com', 'app.todoist.com']
};
