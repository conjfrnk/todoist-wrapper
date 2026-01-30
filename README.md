# todoist-wrapper

A lightweight Electron wrapper for [Todoist](https://app.todoist.com) that provides a native desktop experience on Linux with full Wayland support.

I built this because [the official Flatpak](https://github.com/flathub/com.todoist.Todoist) was 5+ months outdated and couldn't run on my system anymore.

## Features

- **Native Desktop Experience** - Wraps Todoist in a dedicated window with proper desktop integration
- **Wayland Support** - Full native Wayland support for modern Linux desktops
- **Automatic Theme Switching** - Automatically toggles between light and dark themes based on time of day
- **Manual Theme Toggle** - Override auto-theme via the Theme menu
- **Window State Persistence** - Remembers window size and position across sessions
- **Network Resilience** - Circuit breaker pattern with automatic retry and exponential backoff
- **Offline Detection** - User-friendly error page with auto-retry when connection is restored
- **Structured Logging** - JSON logging with rotation for debugging and monitoring
- **Memory Management** - Automatic memory monitoring with GC triggers
- **Secure by Default** - CSP headers, context isolation, sandbox mode, and URL validation

## Installation

### npm (Recommended)

```bash
npm install -g github:conjfrnk/todoist-wrapper
todoist-wrapper
```

### Fedora/RHEL

```bash
sudo dnf install https://github.com/conjfrnk/todoist-wrapper/releases/latest/download/todoist-wrapper-latest.rpm
```

### Gentoo

First add [my overlay](https://github.com/conjfrnk/overlay):

```bash
eselect repository add conjfrnk-overlay git https://github.com/conjfrnk/overlay.git
```

Then emerge the package:

```bash
emerge todoist-wrapper
```

Note: This installs a pre-built binary from [releases](https://github.com/conjfrnk/todoist-wrapper/releases/latest), not compiled from source.

### Generic Linux

Download the latest binary from [releases](https://github.com/conjfrnk/todoist-wrapper/releases/latest), or use the provided install script:

```bash
curl -fsSL https://raw.githubusercontent.com/conjfrnk/todoist-wrapper/main/install.sh | bash
```

To uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/conjfrnk/todoist-wrapper/main/uninstall.sh | bash
```

## Configuration

The application can be configured via environment variables:

| Variable                         | Description                                    | Default                   |
| -------------------------------- | ---------------------------------------------- | ------------------------- |
| `TODOIST_URL`                    | Todoist instance URL (for enterprise)          | `https://app.todoist.com` |
| `TODOIST_AUTO_THEME`             | Enable automatic theme switching               | `true`                    |
| `TODOIST_THEME_INTERVAL_MINUTES` | How often to check time for theme switch       | `30`                      |
| `TODOIST_LIGHT_THEME_START_HOUR` | Hour to switch to light theme (24h format)     | `6`                       |
| `TODOIST_LIGHT_THEME_END_HOUR`   | Hour to switch to dark theme (24h format)      | `18`                      |
| `TODOIST_MAX_RETRIES`            | Connection retry attempts before showing error | `3`                       |
| `TODOIST_TIMEOUT_MS`             | Request timeout in milliseconds                | `30000`                   |
| `LOG_LEVEL`                      | Logging verbosity (debug, info, warn, error)   | `info`                    |

Example usage:

```bash
TODOIST_LIGHT_THEME_START_HOUR=7 TODOIST_LIGHT_THEME_END_HOUR=20 todoist-wrapper
```

## Development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm

### Setup

```bash
git clone https://github.com/conjfrnk/todoist-wrapper.git
cd todoist-wrapper
npm install
npm run build
```

### Available Scripts

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run build`         | Compile TypeScript to JavaScript           |
| `npm start`             | Build and run the application              |
| `npm test`              | Run the test suite                         |
| `npm run test:coverage` | Run tests with coverage report             |
| `npm run typecheck`     | Type-check without emitting                |
| `npm run lint`          | Check code with ESLint                     |
| `npm run lint:fix`      | Fix linting issues automatically           |
| `npm run format`        | Format code with Prettier                  |
| `npm run format:check`  | Check code formatting                      |
| `npm run validate`      | Run typecheck, lint, format, and tests     |
| `npm run package-linux` | Build Linux binary package                 |
| `npm run package-rpm`   | Build RPM package for Fedora/RHEL          |

### Project Structure

```
todoist-wrapper/
├── src/
│   ├── main.ts              # Application entry point
│   ├── preload.ts           # Secure preload script
│   ├── services/            # Service modules
│   │   ├── ConfigService    # Zod-validated configuration
│   │   ├── LoggerService    # Pino-based structured logging
│   │   ├── StoreService     # Async persistence with caching
│   │   ├── SecurityService  # CSP and URL validation
│   │   ├── NetworkService   # Circuit breaker and retry logic
│   │   ├── ThemeService     # Auto theme scheduling
│   │   └── WindowService    # Window lifecycle management
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── dist/                    # Compiled JavaScript output
├── test/                    # Test suite
├── bin/                     # CLI entry point
├── assets/                  # Desktop entry and icons
├── scripts/                 # Build scripts
└── rpm/                     # RPM packaging spec
```

### Architecture

The application uses a service-oriented architecture with:

- **TypeScript** with strict mode for type safety
- **Zod** for runtime configuration validation
- **Pino** for structured JSON logging with file rotation
- **Circuit breaker pattern** for network resilience
- **Singleton services** with dependency injection

## Security

This application implements several [Electron security best practices](https://www.electronjs.org/docs/latest/tutorial/security):

- **Content Security Policy** - Restricts resource loading to Todoist domains
- **Context Isolation** - Renderer process is isolated from Node.js
- **Sandbox Mode** - Renderer runs in a sandboxed environment
- **Node Integration Disabled** - No direct Node.js access from web content
- **Remote Module Disabled** - Legacy remote module is disabled
- **Secure Preload** - IPC bridge with input validation
- **URL Validation** - External URLs are validated before opening
- **Protocol Restrictions** - Only HTTP/HTTPS protocols allowed for external links
- **Permission Handlers** - Explicit permission grants (only notifications allowed)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation (`npm run validate`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
