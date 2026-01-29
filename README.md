# todoist-wrapper

Electron Wrapper for [Todoist](https://app.todoist.com). I made my own because [the Flatpak](https://github.com/flathub/com.todoist.Todoist) was 5+ months old. So outdated, in fact, that it couldn't run on my computer anymore.

Also, this has Wayland support.

## Security

I have implemented several of [these security recommendations](https://www.electronjs.org/docs/latest/tutorial/security) as of v2.0.0

## Install

### npm (Recommended for most users)

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

Note that this will install the binary package (compiled by GitHub Actions and released under [releases](https://github.com/conjfrnk/todoist-wrapper/releases/latest)) and will not compile from source.

### Generic Linux (Manual)

Use `install.sh` to install the binary file, or download from [releases](https://github.com/conjfrnk/todoist-wrapper/releases/latest).

Use `uninstall.sh` to uninstall everything.

## Other Package Managers

- Arch - coming sometime down the road

## Develop

```bash
npm install    # Install dependencies
npm run start  # Run the app
```
