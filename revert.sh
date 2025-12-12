#!/usr/bin/env bash
set -euo pipefail

TARGET_COMMIT="832f68ccaf114d6088806823901be82fae535440"
BRANCH="main"
REMOTE="origin"

echo "==> Fetching latest..."
git fetch --all --prune

echo "==> Switching to ${BRANCH}..."
git checkout "${BRANCH}"

echo "==> Making sure ${BRANCH} is up to date with ${REMOTE}/${BRANCH}..."
git pull --ff-only "${REMOTE}" "${BRANCH}"

echo "==> Showing commits that will be removed (newest first):"
git --no-pager log --oneline "${TARGET_COMMIT}..HEAD" || true

echo "==> Creating a local backup tag just in case..."
BACKUP_TAG="backup-before-reset-$(date +%Y%m%d-%H%M%S)"
git tag "${BACKUP_TAG}"
echo "    Created tag: ${BACKUP_TAG}"

echo "==> Hard resetting ${BRANCH} to ${TARGET_COMMIT}..."
git reset --hard "${TARGET_COMMIT}"

echo "==> Force-updating ${REMOTE}/${BRANCH} (safer force)..."
git push "${REMOTE}" "${BRANCH}" --force-with-lease

echo "✅ Done. ${BRANCH} now matches ${TARGET_COMMIT} and remote is updated."
echo "   If you need to undo this reset: git reset --hard ${BACKUP_TAG} && git push --force-with-lease"
