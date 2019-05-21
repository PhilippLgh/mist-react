#!/bin/bash
set -x

if [[ $CIRCLE_JOB == 'build-mac' ]]
then
  curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version=1.15.2
  # export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
  echo 'export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"' >> ~/.bashrc
fi;

echo `node --version`
echo `yarn --version`
