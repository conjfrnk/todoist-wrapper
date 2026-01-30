import {
    validateBounds,
    boundsChanged,
    createBoundsContext
} from '../../src/utils/bounds-validator.js';
import type { BoundsValidationContext, WindowBounds } from '../../src/types/window.types.js';

describe('validateBounds', () => {
    const defaultContext: BoundsValidationContext = {
        screenWidth: 1920,
        screenHeight: 1080,
        minWidth: 100,
        maxWidth: 10000,
        minHeight: 100,
        maxHeight: 10000,
        defaultWidth: 1250,
        defaultHeight: 1000
    };

    test('returns defaults for null bounds', () => {
        const result = validateBounds(null, defaultContext);
        expect(result.width).toBe(1250);
        expect(result.height).toBe(1000);
    });

    test('returns defaults for undefined bounds', () => {
        const result = validateBounds(undefined, defaultContext);
        expect(result.width).toBe(1250);
        expect(result.height).toBe(1000);
    });

    test('returns defaults for empty object', () => {
        const result = validateBounds({}, defaultContext);
        expect(result.width).toBe(1250);
        expect(result.height).toBe(1000);
    });

    test('validates width within bounds', () => {
        const result = validateBounds({ width: 800, height: 600 }, defaultContext);
        expect(result.width).toBe(800);
    });

    test('constrains width to screen width', () => {
        const result = validateBounds({ width: 3000, height: 600 }, defaultContext);
        expect(result.width).toBe(1920);
    });

    test('rejects width below minimum', () => {
        const result = validateBounds({ width: 50, height: 600 }, defaultContext);
        expect(result.width).toBe(1250); // Falls back to default
    });

    test('rejects width above maximum', () => {
        const result = validateBounds({ width: 20000, height: 600 }, defaultContext);
        expect(result.width).toBe(1250); // Falls back to default
    });

    test('validates height within bounds', () => {
        const result = validateBounds({ width: 800, height: 600 }, defaultContext);
        expect(result.height).toBe(600);
    });

    test('constrains height to screen height', () => {
        const result = validateBounds({ width: 800, height: 2000 }, defaultContext);
        expect(result.height).toBe(1080);
    });

    test('rejects height below minimum', () => {
        const result = validateBounds({ width: 800, height: 50 }, defaultContext);
        expect(result.height).toBe(1000); // Falls back to default
    });

    test('validates x position', () => {
        const result = validateBounds({ width: 800, height: 600, x: 100 }, defaultContext);
        expect(result.x).toBe(100);
    });

    test('constrains x position to keep window partially visible - right edge', () => {
        const result = validateBounds({ width: 800, height: 600, x: 2000 }, defaultContext);
        expect(result.x).toBe(1920 - 100); // screenWidth - 100
    });

    test('constrains x position to keep window partially visible - left edge', () => {
        const result = validateBounds({ width: 800, height: 600, x: -1000 }, defaultContext);
        expect(result.x).toBe(-800 + 100); // -width + 100
    });

    test('validates y position', () => {
        const result = validateBounds({ width: 800, height: 600, y: 100 }, defaultContext);
        expect(result.y).toBe(100);
    });

    test('constrains y position - bottom edge', () => {
        const result = validateBounds({ width: 800, height: 600, y: 1500 }, defaultContext);
        expect(result.y).toBe(1080 - 50); // screenHeight - 50
    });

    test('constrains y position - top edge', () => {
        const result = validateBounds({ width: 800, height: 600, y: -100 }, defaultContext);
        expect(result.y).toBe(0);
    });

    test('handles non-number values', () => {
        const bounds = { width: 'invalid' as unknown as number, height: null as unknown as number };
        const result = validateBounds(bounds, defaultContext);
        expect(result.width).toBe(1250);
        expect(result.height).toBe(1000);
    });
});

describe('boundsChanged', () => {
    test('returns true for undefined old bounds', () => {
        expect(boundsChanged(undefined, { width: 800, height: 600 })).toBe(true);
    });

    test('returns false when bounds are identical', () => {
        const bounds: WindowBounds = { width: 800, height: 600, x: 100, y: 100 };
        expect(boundsChanged(bounds, bounds)).toBe(false);
    });

    test('returns true when width changes', () => {
        const old: WindowBounds = { width: 800, height: 600 };
        const next: WindowBounds = { width: 900, height: 600 };
        expect(boundsChanged(old, next)).toBe(true);
    });

    test('returns true when height changes', () => {
        const old: WindowBounds = { width: 800, height: 600 };
        const next: WindowBounds = { width: 800, height: 700 };
        expect(boundsChanged(old, next)).toBe(true);
    });

    test('returns true when x changes', () => {
        const old: WindowBounds = { width: 800, height: 600, x: 100 };
        const next: WindowBounds = { width: 800, height: 600, x: 200 };
        expect(boundsChanged(old, next)).toBe(true);
    });

    test('returns true when y changes', () => {
        const old: WindowBounds = { width: 800, height: 600, y: 100 };
        const next: WindowBounds = { width: 800, height: 600, y: 200 };
        expect(boundsChanged(old, next)).toBe(true);
    });
});

describe('createBoundsContext', () => {
    test('creates context with all properties', () => {
        const windowConfig = {
            defaultWidth: 1000,
            defaultHeight: 800,
            minWidth: 100,
            maxWidth: 5000,
            minHeight: 100,
            maxHeight: 5000
        };

        const context = createBoundsContext(1920, 1080, windowConfig);

        expect(context.screenWidth).toBe(1920);
        expect(context.screenHeight).toBe(1080);
        expect(context.defaultWidth).toBe(1000);
        expect(context.defaultHeight).toBe(800);
        expect(context.minWidth).toBe(100);
        expect(context.maxWidth).toBe(5000);
        expect(context.minHeight).toBe(100);
        expect(context.maxHeight).toBe(5000);
    });
});
