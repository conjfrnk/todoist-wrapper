import {
    escapeHtml,
    sanitizeForHtml,
    isValidUrl,
    sanitizeUrl,
    stripDangerousProtocols,
    isTodoistDomain,
    sanitizeErrorMessage
} from '../../src/utils/sanitize.js';

describe('escapeHtml', () => {
    test('escapes ampersand', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    test('escapes less than', () => {
        expect(escapeHtml('a < b')).toBe('a &lt; b');
    });

    test('escapes greater than', () => {
        expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    test('escapes double quotes', () => {
        expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c');
    });

    test('escapes single quotes', () => {
        expect(escapeHtml("a 'b' c")).toBe('a &#x27;b&#x27; c');
    });

    test('escapes forward slash', () => {
        expect(escapeHtml('a/b')).toBe('a&#x2F;b');
    });

    test('escapes multiple characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
        );
    });

    test('handles empty string', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('handles string with no special characters', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
    });
});

describe('sanitizeForHtml', () => {
    test('handles null', () => {
        expect(sanitizeForHtml(null)).toBe('');
    });

    test('handles undefined', () => {
        expect(sanitizeForHtml(undefined)).toBe('');
    });

    test('converts numbers to string and escapes', () => {
        expect(sanitizeForHtml(123)).toBe('123');
    });

    test('escapes string content', () => {
        expect(sanitizeForHtml('<script>')).toBe('&lt;script&gt;');
    });
});

describe('isValidUrl', () => {
    test('accepts https URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    test('accepts http URLs', () => {
        expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('rejects non-http protocols', () => {
        expect(isValidUrl('javascript:alert(1)')).toBe(false);
        expect(isValidUrl('file:///etc/passwd')).toBe(false);
        expect(isValidUrl('data:text/html,test')).toBe(false);
        expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    test('rejects invalid URLs', () => {
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });
});

describe('sanitizeUrl', () => {
    test('returns normalized https URLs', () => {
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
        expect(sanitizeUrl('HTTPS://EXAMPLE.COM')).toBe('https://example.com/');
    });

    test('returns normalized http URLs', () => {
        expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    test('returns null for non-http protocols', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
        expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    test('returns null for invalid URLs', () => {
        expect(sanitizeUrl('not-a-url')).toBeNull();
        expect(sanitizeUrl('')).toBeNull();
    });
});

describe('stripDangerousProtocols', () => {
    test('strips javascript protocol', () => {
        expect(stripDangerousProtocols('javascript:alert(1)')).toBe('');
        expect(stripDangerousProtocols('JAVASCRIPT:alert(1)')).toBe('');
    });

    test('strips data protocol', () => {
        expect(stripDangerousProtocols('data:text/html,test')).toBe('');
    });

    test('strips file protocol', () => {
        expect(stripDangerousProtocols('file:///etc/passwd')).toBe('');
    });

    test('strips vbscript protocol', () => {
        expect(stripDangerousProtocols('vbscript:msgbox')).toBe('');
    });

    test('strips about protocol', () => {
        expect(stripDangerousProtocols('about:blank')).toBe('');
    });

    test('preserves safe URLs', () => {
        expect(stripDangerousProtocols('https://example.com')).toBe('https://example.com');
        expect(stripDangerousProtocols('http://example.com')).toBe('http://example.com');
    });
});

describe('isTodoistDomain', () => {
    test('returns true for same origin', () => {
        expect(isTodoistDomain('https://app.todoist.com/app', 'https://app.todoist.com')).toBe(
            true
        );
        expect(isTodoistDomain('https://app.todoist.com/', 'https://app.todoist.com')).toBe(true);
    });

    test('returns false for different origin', () => {
        expect(isTodoistDomain('https://google.com', 'https://app.todoist.com')).toBe(false);
        expect(isTodoistDomain('https://todoist.com', 'https://app.todoist.com')).toBe(false);
    });

    test('returns false for invalid URLs', () => {
        expect(isTodoistDomain('not-a-url', 'https://app.todoist.com')).toBe(false);
    });
});

describe('sanitizeErrorMessage', () => {
    test('escapes Error message', () => {
        const error = new Error('<script>alert("xss")</script>');
        expect(sanitizeErrorMessage(error)).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
        );
    });

    test('escapes string errors', () => {
        expect(sanitizeErrorMessage('<script>')).toBe('&lt;script&gt;');
    });

    test('handles non-error objects', () => {
        expect(sanitizeErrorMessage(null)).toBe('An unknown error occurred');
        expect(sanitizeErrorMessage(undefined)).toBe('An unknown error occurred');
        expect(sanitizeErrorMessage({})).toBe('An unknown error occurred');
    });
});
