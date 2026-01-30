import {
    parseEnvBool,
    parseEnvInt,
    parseEnvString,
    parseEnvEnum
} from '../../src/utils/env-parser.js';

describe('parseEnvBool', () => {
    test('returns default for undefined', () => {
        expect(parseEnvBool(undefined, true)).toBe(true);
        expect(parseEnvBool(undefined, false)).toBe(false);
    });

    test('returns default for empty string', () => {
        expect(parseEnvBool('', true)).toBe(true);
        expect(parseEnvBool('', false)).toBe(false);
    });

    test('parses "true" as true', () => {
        expect(parseEnvBool('true', false)).toBe(true);
        expect(parseEnvBool('TRUE', false)).toBe(true);
        expect(parseEnvBool('True', false)).toBe(true);
    });

    test('parses "1" as true', () => {
        expect(parseEnvBool('1', false)).toBe(true);
    });

    test('parses other values as false', () => {
        expect(parseEnvBool('false', true)).toBe(false);
        expect(parseEnvBool('FALSE', true)).toBe(false);
        expect(parseEnvBool('0', true)).toBe(false);
        expect(parseEnvBool('no', true)).toBe(false);
        expect(parseEnvBool('anything', true)).toBe(false);
    });
});

describe('parseEnvInt', () => {
    test('returns default for undefined', () => {
        expect(parseEnvInt(undefined, 42)).toBe(42);
    });

    test('returns default for empty string', () => {
        expect(parseEnvInt('', 42)).toBe(42);
    });

    test('parses valid integers', () => {
        expect(parseEnvInt('123', 0)).toBe(123);
        expect(parseEnvInt('-5', 0)).toBe(-5);
        expect(parseEnvInt('0', 42)).toBe(0);
    });

    test('returns default for invalid integers', () => {
        expect(parseEnvInt('not-a-number', 42)).toBe(42);
        expect(parseEnvInt('abc', 42)).toBe(42);
    });

    test('truncates floating point numbers', () => {
        expect(parseEnvInt('12.34', 42)).toBe(12);
        expect(parseEnvInt('99.99', 0)).toBe(99);
    });
});

describe('parseEnvString', () => {
    test('returns default for undefined', () => {
        expect(parseEnvString(undefined, 'default')).toBe('default');
    });

    test('returns default for empty string', () => {
        expect(parseEnvString('', 'default')).toBe('default');
    });

    test('returns value when provided', () => {
        expect(parseEnvString('value', 'default')).toBe('value');
        expect(parseEnvString('https://example.com', 'default')).toBe('https://example.com');
    });
});

describe('parseEnvEnum', () => {
    const allowedValues = ['debug', 'info', 'warn', 'error'] as const;

    test('returns default for undefined', () => {
        expect(parseEnvEnum(undefined, allowedValues, 'info')).toBe('info');
    });

    test('returns default for empty string', () => {
        expect(parseEnvEnum('', allowedValues, 'info')).toBe('info');
    });

    test('returns value when in allowed list', () => {
        expect(parseEnvEnum('debug', allowedValues, 'info')).toBe('debug');
        expect(parseEnvEnum('error', allowedValues, 'info')).toBe('error');
    });

    test('returns default for invalid values', () => {
        expect(parseEnvEnum('invalid', allowedValues, 'info')).toBe('info');
        // Note: parseEnvEnum normalizes to lowercase before checking
        expect(parseEnvEnum('DEBUG', allowedValues, 'info')).toBe('debug'); // lowercase 'debug' is valid
    });
});
