import type { BrowserWindowConstructorOptions, Rectangle } from 'electron';

export interface WindowBounds {
    width: number;
    height: number;
    x?: number;
    y?: number;
}

export interface ValidatedWindowBounds extends WindowBounds {
    x?: number;
    y?: number;
}

export interface WindowServiceOptions {
    defaultBounds: WindowBounds;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
}

export interface WindowServiceInterface {
    createWindow(): Promise<void>;
    getWindow(): Electron.BrowserWindow | null;
    saveBounds(): Promise<void>;
    close(): void;
}

export interface BoundsValidationContext {
    screenWidth: number;
    screenHeight: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    defaultWidth: number;
    defaultHeight: number;
}

export type ElectronWindowOptions = BrowserWindowConstructorOptions;
export type ElectronRectangle = Rectangle;
