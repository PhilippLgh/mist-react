[![CircleCI](https://circleci.com/gh/ethereum/mist-shell/tree/master.svg?style=svg)](https://circleci.com/gh/ethereum/mist-shell/tree/master)

# Info

This is the hosting application for [Mist UI](https://github.com/ethereum/mist-ui) and can be considered a [Mist](https://github.com/ethereum/Mist) alternative.
This project ensures that the user can update, configure and run the Mist UI web app and client binaries such as geth.
Moreover this project can be bundled with Mist UI and create distributable installers that can be found under 'releases'.

###  Quick Start

First we need to install less and Mist UI:

```
npm install -g less
git clone https://github.com/ethereum/mist-ui.git
cd mist-ui
yarn && yarn run watch-css 
```

In another terminal, go to the mist-ui folder, type:

```
yarn run start
```

Then in a third terminal, outside the mist-ui folder and install and run mist-shell:

```
git clone https://github.com/ethereum/mist-shell.git
cd mist-shell
yarn && yarn start:dev
```

## Dev Mode
The developer mode will try to load Mist UI from a locally running web server on port `3080`. To run in dev mode you will have to follow the setup instructions on the Mist UI repo.

## Production Mode
In the the production mode a bundled app can be loaded from either `fs` or a remote location such as Mist UI's GitHub releases.

# Release Process

## Steps to release with CI
- Bump version number
- Push / merge to master
- TODO set trigger for Electron releases (with auto-updater), mist-ui-react releases (without auto-updater)

## Steps to test release (locally)
- npm run prepare-release
  - will download latest app release and package it with shell
- npm run build
- double check that release/unpacked/Mist.exe is working

## Steps to release (locally)
- get github access token and insert into .env as GH_TOKEN
- TODO changelog, and release draft
- TODO installer signing
- npm run release -> auto publishes
- go to github, check everything, edit description and change from draft to release

# Contributing

There are many ways to get involved with this project. Get started [here](/docs/CONTRIBUTING.md).
