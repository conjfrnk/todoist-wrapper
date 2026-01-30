# todoist-wrapper

A lightweight Electron wrapper for [Todoist](https://app.todoist.com) that provides a native desktop experience on Linux with full Wayland support.

I built this because [the official Flatpak](https://github.com/flathub/com.todoist.Todoist) was 5+ months outdated and couldn't run on my system anymore.

## Features

- **Native Desktop Experience** - Wraps Todoist in a dedicated window with proper desktop integration
- **Wayland Support** - Full native Wayland support for modern Linux desktops
- **Automatic Theme Switching** - Automatically toggles between light and dark themes based on time of day
- **Manual Theme Toggle** - Override auto-theme via the Theme menu
- **Window State Persistence** - Remembers window size and position across sessions
- **Network Resilience** - Automatic retry with exponential backoff for failed connections
- **Offline Detection** - User-friendly error page with auto-retry when connection is restored
- **Secure by Default** - Context isolation, sandbox mode, and URL validation enabled

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

Example usage:

```bash
TODOIST_LIGHT_THEME_START_HOUR=7 TODOIST_LIGHT_THEME_END_HOUR=20 todoist-wrapper
```

## Development

### Prerequisites

- Node.js (LTS recommended)
- npm

### Setup

```bash
git clone https://github.com/conjfrnk/todoist-wrapper.git
cd todoist-wrapper
npm install
```

### Available Scripts

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `npm start`             | Run the application               |
| `npm test`              | Run the test suite                |
| `npm run lint`          | Check code with ESLint            |
| `npm run lint:fix`      | Fix linting issues automatically  |
| `npm run format`        | Format code with Prettier         |
| `npm run format:check`  | Check code formatting             |
| `npm run validate`      | Run lint, format check, and tests |
| `npm run package-linux` | Build Linux binary package        |
| `npm run package-rpm`   | Build RPM package for Fedora/RHEL |

### Project Structure

```
todoist-wrapper/
├── index.js          # Main Electron application
├── config.cjs        # Configuration management
├── theme.js          # Theme compatibility layer
├── bin/              # CLI entry point
├── assets/           # Desktop entry and icons
├── scripts/          # Build scripts
├── rpm/              # RPM packaging spec
└── test/             # Test suite
```

## Security

This application implements several [Electron security best practices](https://www.electronjs.org/docs/latest/tutorial/security):

- **Context Isolation** - Renderer process is isolated from Node.js
- **Sandbox Mode** - Renderer runs in a sandboxed environment
- **Node Integration Disabled** - No direct Node.js access from web content
- **Remote Module Disabled** - Legacy remote module is disabled
- **URL Validation** - External URLs are validated before opening
- **Protocol Restrictions** - Only HTTP/HTTPS protocols allowed for external links

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
