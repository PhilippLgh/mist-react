[![CircleCI](https://circleci.com/gh/ethereum/grid/tree/master.svg?style=svg)](https://circleci.com/gh/ethereum/grid/tree/master)

# Info

This is the hosting application for [Grid UI](https://github.com/ethereum/grid-ui) and can be considered a [Mist](https://github.com/ethereum/Mist) alternative.
This project ensures that the user can update, configure and run the Grid UI web app and client binaries such as geth.
Moreover this project can be bundled with Grid UI and create distributable installers that can be found under 'releases'.

### Quick Start

First we need to install less and Grid UI:

```
npm install -g less
git clone https://github.com/ethereum/grid-ui.git
cd grid-ui
yarn && yarn run watch-css
```

In another terminal, go to the grid-ui folder, type:

```
yarn run start
```

Then in a third terminal, outside the grid-ui folder and install and run grid:

```
git clone https://github.com/ethereum/grid.git
cd grid
yarn && yarn start:dev
```

## Dev Mode

The developer mode will try to load grid UI from a locally running web server on port `3080`. To run in dev mode you will have to follow the setup instructions on the Grid UI repo.

### Debugging

Enable debug logging to console with `DEBUG=geth-js yarn start:dev`.

More namespaces will be added over time and listed here. We would appreciate contributions in adding more throughout our modules.

## Production Mode

In the the production mode a bundled app can be loaded from either `fs` or a remote location such as Grid UI's GitHub releases.

# Release Process

## Steps to release with CI

- Bump version number
- Push / merge to master
- TODO set trigger for Electron releases (with auto-updater), grid-ui releases (without auto-updater)

## Steps to test release (locally)

- npm run prepare-release
  - will download latest app release and package it with shell
- npm run build
- double check that release/unpacked/Grid.exe is working

## Steps to release (locally)

- get github access token and insert into .env as GH_TOKEN
- TODO changelog, and release draft
- TODO installer signing
- npm run release -> auto publishes
- go to github, check everything, edit description and change from draft to release

# Contributing

There are many ways to get involved with this project. Get started [here](/docs/CONTRIBUTING.md).
