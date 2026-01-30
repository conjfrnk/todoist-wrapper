/**
 * Parse a boolean from environment variable
 * Accepts 'true', 'TRUE', '1' as true values
 */
export function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse an integer from environment variable
 * Returns defaultValue for undefined, empty, or non-numeric values
 */
export function parseEnvInt(value: string | undefined, defaultValue: number): number {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse a string from environment variable
 * Returns defaultValue for undefined or empty values
 */
export function parseEnvString(value: string | undefined, defaultValue: string): string {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return value;
}

/**
 * Parse an enum from environment variable
 * Returns defaultValue if the value is not in the allowed list
 */
export function parseEnvEnum<T extends string>(
    value: string | undefined,
    allowedValues: readonly T[],
    defaultValue: T
): T {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const normalized = value.toLowerCase() as T;
    return allowedValues.includes(normalized) ? normalized : defaultValue;
}
