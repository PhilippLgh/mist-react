#!/bin/bash
curl -u mist-bot:$GITHUB_TOKEN -X POST https://api.github.com/repos/ethereum/mist-shell/pages/builds -H "Accept: application/vnd.github.mister-fantastic-preview+json"

