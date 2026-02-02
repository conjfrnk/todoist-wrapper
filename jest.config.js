/** @type {import('jest').Config} */
export default {
    // Use ts-jest for TypeScript support with ESM
    preset: 'ts-jest/presets/default-esm',

    // Test environment
    testEnvironment: 'node',

    // Module name mapper for .js extensions in imports
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // Transform configuration
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    module: 'ESNext',
                    moduleResolution: 'NodeNext',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true
                }
            }
        ]
    },

    // File extensions to consider
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Test file patterns - only run TypeScript tests for utils (which don't need Electron)
    testMatch: ['**/test/utils/**/*.test.ts', '**/test/services/ConfigService.test.ts'],

    // Ignore legacy JS tests and packaged app
    testPathIgnorePatterns: ['/node_modules/', '/dist-package/', '\\.js$'],

    // Coverage configuration
    collectCoverageFrom: ['src/utils/**/*.ts', 'src/services/ConfigService.ts', '!src/**/*.d.ts'],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Coverage reporters
    coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

    // Coverage directory
    coverageDirectory: 'coverage',

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output
    verbose: true,

    // Timeout
    testTimeout: 10000,

    // Extensions to treat as ESM
    extensionsToTreatAsEsm: ['.ts'],

    // Transform ignore patterns
    transformIgnorePatterns: ['/node_modules/']
};
