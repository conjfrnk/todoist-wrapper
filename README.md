# todoist-wrapper
Electron Wrapper for [Todoist](https://app.todoist.com). I made my own because [the Flatpak](https://github.com/flathub/com.todoist.Todoist) was 5+ months old. So outdated, in fact, that it couldn't run on my computer anymore.

Also, this has Wayland support.

## Security
I have implemented several of [these security recommendations](https://www.electronjs.org/docs/latest/tutorial/security) as of v2.0.0

## Install
Use `install.sh` to install the binary file

I wish there was a way to be able to use `npm install -g conjfrnk/todoist-wrapper` or something like that, but I've experienced failure after failure with that so I'm sticking with what I know.

Use `uninstall.sh` to uninstall everything

## Gentoo
First add [my overlay](https://github.com/conjfrnk/overlay)

`eselect repository add conjfrnk-overlay git https://github.com/conjfrnk/overlay.git`

Then emerge the package

`emerge todoist-wrapper`

Note that this will install the binary package (compiled by GitHub Actions and released under [releases](https://github.com/conjfrnk/todoist-wrapper/releases/latest)) and will not compile from source. I am working on how to compile from source.

## Other Package Managers
- Fedora coming eventually
- Arch too? Sometime down the road

## Develop
`npm install` to install dependencies

`npm run start` to run the app
