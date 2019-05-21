#!/bin/bash
set -x

if [[ $CIRCLE_JOB == 'build-mac' ]]
then

  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  nvm install 8.11

fi;

echo `node --version`
echo `yarn --version`
