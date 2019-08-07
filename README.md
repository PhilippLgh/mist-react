<p align="center">
<img src="https://user-images.githubusercontent.com/47108/53807420-80433380-3f1d-11e9-80cd-967aabb26506.png" width="524" />
</p>

[![CircleCI](https://circleci.com/gh/ethereum/grid/tree/master.svg?style=svg)](https://circleci.com/gh/ethereum/grid/tree/master)

# Ethereum Grid

Grid is a desktop application that allows you to securely download, configure and use various clients and tools in the Ethereum ecosystem. Download the [latest version](https://grid.ethereum.org/).

![](https://imgur.com/T3Tt65P.jpg)

See this [introductory post](https://medium.com/ethereum-grid/introducing-ethereum-grid-1e65e7fb771e) to learn more about the motivations behind the project. Release announcements and tutorials are released on the project [Medium publication](https://medium.com/ethereum-grid).

## Development

This repo is the hosting application for [Grid UI](https://github.com/ethereum/grid-ui).

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

### Dev Mode

`yarn start:dev`

The developer mode will try to load grid UI from a locally running web server on port `3080`.

#### Debugging

Enable debug logging to console with `DEBUG=geth-js yarn start:dev`.

More namespaces will be added over time and listed here. We would appreciate contributions in adding more throughout our modules.

### Production Mode

`yarn start:prod`

In production mode, a bundled app can be loaded from either `fs` or a remote location such as Grid UI's GitHub releases.

### Release Process

See the developer guide [here](/RELEASE.md).

### Landing page development guide

See instructions at [/docs](/docs/).

### Contributing

There are many ways to get involved with this project. Get started [here](/CONTRIBUTING.md).
