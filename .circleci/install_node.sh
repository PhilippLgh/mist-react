#!/bin/bash
set -x

if [[ $CIRCLE_JOB == 'build-mac' ]]
then

  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

  echo 'export NVM_DIR="$HOME/.nvm"' >> $BASH_ENV
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> $BASH_ENV

fi;

echo `node --version`
echo `yarn --version`
