#!/usr/bin/env bash
set -euo pipefail

read -r -p "This will sync the current state of the main branch into stable. Are you sure? [y/N] " confirm
if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

git checkout stable
git merge main
git push origin stable
git checkout main