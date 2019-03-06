<p align="center">
<img src="https://user-images.githubusercontent.com/47108/53807420-80433380-3f1d-11e9-80cd-967aabb26506.png" width="524" />
</p>

[![CircleCI](https://circleci.com/gh/ethereum/grid/tree/master.svg?style=svg)](https://circleci.com/gh/ethereum/grid/tree/master)

# Enter the Grid

This is the hosting application for [Grid UI](https://github.com/ethereum/grid-ui) and can be considered a [Mist](https://github.com/ethereum/Mist) alternative in the long run.
This project ensures that the user can update, configure and run the Grid UI web app and client binaries, such as geth.

### Quick Start

Install and run Grid UI:

```
git clone https://github.com/ethereum/grid-ui.git
cd grid-ui
yarn && yarn start
```

Install and run Grid:

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

See the developer guide [here](/RELEASE.md).

# Landing page development guide

See instructions at [/docs](/docs/README.md).

# Contributing

There are many ways to get involved with this project. Get started [here](/CONTRIBUTING.md).
