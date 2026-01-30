import type {
    WindowBounds,
    ValidatedWindowBounds,
    BoundsValidationContext
} from '../types/window.types.js';

/**
 * Validate window bounds against screen constraints
 * Ensures windows remain partially visible on screen
 */
export function validateBounds(
    bounds: Partial<WindowBounds> | null | undefined,
    context: BoundsValidationContext
): ValidatedWindowBounds {
    const {
        screenWidth,
        screenHeight,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        defaultWidth,
        defaultHeight
    } = context;

    const validated: ValidatedWindowBounds = {
        width: defaultWidth,
        height: defaultHeight
    };

    if (!bounds || typeof bounds !== 'object') {
        return validated;
    }

    // Validate width
    if (typeof bounds.width === 'number' && bounds.width >= minWidth && bounds.width <= maxWidth) {
        validated.width = Math.min(bounds.width, screenWidth);
    }

    // Validate height
    if (
        typeof bounds.height === 'number' &&
        bounds.height >= minHeight &&
        bounds.height <= maxHeight
    ) {
        validated.height = Math.min(bounds.height, screenHeight);
    }

    // Validate x position - keep at least 100px visible
    if (typeof bounds.x === 'number') {
        const minX = -validated.width + 100;
        const maxX = screenWidth - 100;
        validated.x = Math.max(minX, Math.min(bounds.x, maxX));
    }

    // Validate y position - keep at least 50px visible at bottom
    if (typeof bounds.y === 'number') {
        const minY = 0;
        const maxY = screenHeight - 50;
        validated.y = Math.max(minY, Math.min(bounds.y, maxY));
    }

    return validated;
}

/**
 * Check if bounds have changed significantly (to avoid unnecessary saves)
 */
export function boundsChanged(
    oldBounds: WindowBounds | undefined,
    newBounds: WindowBounds
): boolean {
    if (!oldBounds) {
        return true;
    }

    return (
        oldBounds.width !== newBounds.width ||
        oldBounds.height !== newBounds.height ||
        oldBounds.x !== newBounds.x ||
        oldBounds.y !== newBounds.y
    );
}

/**
 * Create bounds validation context from config and screen
 */
export function createBoundsContext(
    screenWidth: number,
    screenHeight: number,
    windowConfig: {
        defaultWidth: number;
        defaultHeight: number;
        minWidth: number;
        maxWidth: number;
        minHeight: number;
        maxHeight: number;
    }
): BoundsValidationContext {
    return {
        screenWidth,
        screenHeight,
        ...windowConfig
    };
}
