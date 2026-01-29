// eslint.config.js - ESLint flat config
import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Node.js globals
                process: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                Buffer: 'readonly',
                URL: 'readonly',
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly'
            }
        },
        rules: {
            // Error prevention
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-console': 'off', // Allow console for logging
            'no-debugger': 'error',

            // Best practices
            eqeqeq: ['error', 'always'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-return-await': 'error',
            'require-await': 'error',

            // Style (handled by Prettier, but some semantic ones)
            'prefer-const': 'error',
            'no-var': 'error',
            'object-shorthand': 'error',
            'prefer-template': 'error',
            'prefer-arrow-callback': 'error'
        }
    },
    {
        // CommonJS files
        files: ['**/*.cjs', 'config.js', 'theme.js'],
        languageOptions: {
            sourceType: 'commonjs'
        }
    },
    {
        // Test files
        files: ['test/**/*.js'],
        languageOptions: {
            sourceType: 'commonjs'
        }
    },
    {
        ignores: ['node_modules/**', 'dist/**', 'coverage/**']
    }
];
