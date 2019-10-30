## Developer Guide: Releases

### Background

`electron-builder` is used to package up the application by CircleCI. The configuration settings can be found in `package.json`, under the `"build"` key.

If you include a new top-level file to be distributed with the application, it must be added manually to the `"files"` array in the configuration settings.

### Testing a release candidate locally

`yarn dist` will package up the app, with installers for each OS, and output them into a `release` directory.

Note: on macOS, you'll get a warning if you don't sign the package with an Apple developer certificate, which happens within the `yarn dist` step. See this [tutorial](https://9to5mac.com/2016/03/27/how-to-create-free-apple-developer-account-sideload-apps/) if you need help getting set up with a free account. A `Mac Development` certificate will suffice for local testing.

### Preparing a release via CI (recommended)

1. **Update the version number** of the release in `package.json`.
1. **Prepare Grid-UI for release** by merging any changes from `dev` into `master`. **Important**: do not squash and merge, as you'll end up with two different branches. Use "Create a merge commit".
1. **Merge the new code into `master`.** CircleCI will build the new installers (`yarn dist`) and create a draft release for the new version. **Note:** if the CI builds for a version number that already exists, it will replace the assets for that version.
1. **Write release notes.** The draft can be edited from the GitHub releases page.
1. **Publish the release.** You must manually publish the draft. Within GitHub's UI, edit the draft and select `Publish release`.
1. **Update Github pages** Rebuild github pages to display the latest release (git commit -m "docs: pages rebuild" --allow-empty && git push origin master)

### Preparing a release manually (not recommended)

1. **Add the GitHub access token** to the `.env` file as `GH_TOKEN`.
1. **Update the version number** of the release in `package.json`.
1. **Prepare Grid-UI for release** by merging any changes from `dev` into `master`. **Important**: do not squash and merge, as you'll end up with two different branches. Use "Create a merge commit".
1. **Configure code signing** keys for mac and windows. [Follow guide here](https://www.electron.build/code-signing).
1. **Manually initiate the release** with `yarn release`.
1. **Write release notes.** The draft can be edited from the GitHub releases page.
1. **Publish the release.** You must manually publish the draft. Within GitHub's UI, edit the draft and select `Publish release`.
1. **Update Github pages** Rebuild github pages to display the latest release (git commit -m "docs: pages rebuild" --allow-empty && git push origin master)

### Using build channels

`grid-ui` versions may be published to various build channels. Push the changes to the appropriate branch and the CI will complete the deployment. Available channels include: `dev`, `ci`, `alpha`, `beta`, `nightly`, `production`, `master`, and `release`.

## Releasing Grid Apps

For apps created with create-react-app:

- Build the app:
  - `yarn build`
- Zip the output (but don't include the `build` dir):
  - `cd build && zip grid-appname-app-0.1.0.zip .`
- Create a new release in GitHub and include the zip file.
- Include the app in `grid_apps/apps.json`. See the file for examples. This will include the app in the Nano app menu.
- Include the app in relevant client configurations (`about > apps`). See `ethereum_clients/client_plugins/geth.js` for examples.
