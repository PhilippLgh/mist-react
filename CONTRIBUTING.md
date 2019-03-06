## Contributing to Ethereum Grid

First, thanks for your interest! We appreciate your time.

#### Some background

The project has been broken into several pieces:

- [ethereum-react-components](https://github.com/ethereum/ethereum-react-components) - a React component library
- [grid-ui](https://github.com/ethereum/grid-ui) - uses the component library to assemble Grid's user interface
- Grid (this repo) - the desktop app wrapper for grid-ui
- [electron-app-manager](https://github.com/PhilippLgh/electron-app-manager) - handles app updates

The MVP will be a node management tool for power users. No wallet or browser features will be included in the first release.

#### How can I contribute?

- Answer/contribute to other user's open issues.
- Report a bug by opening a GitHub issue.
- Suggest an enhancement by opening a GitHub issue.
- Contribute to documentation by opening a pull request.
- Fix a bug or add a feature by opening a pull request.
  - Looking for something to work on? Try filtering for [good first issue](https://github.com/ethereum/grid/labels/good%20first%20issue) tags.

#### Adding new features

Before spending the time on a new feature that isn't already requested in an issue, please open a new issue to suggest the enhancement. The team will let you know whether the proposed feature fits into our broader vision.

#### Reporting bugs

Before filing, please search for related issues and contribute to existing discussions if appropriate. If no bug resembles yours, do your best to fill out the new issue template, including detailed steps to reproduce the issue.

#### Pull Requests

- Please fill out the PR template! Your answers will help us review and merge your code more quickly.
- Use your linter! If your editor isn't configured with eslint, run it in a terminal window with `yarn lint:watch` or `npm run lint:watch`.
- Use [conventional commits](https://www.conventionalcommits.org/) to help us evaluate semantic versioning needs, e.g. `fix:`, `feat:`, `docs:`, etc. commit prefixes.
- [Reference related issues](https://help.github.com/articles/closing-issues-using-keywords/) when appropriate, e.g. "Closes #13" in a PR description.
