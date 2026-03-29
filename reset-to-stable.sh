#!/usr/bin/env bash
set -euo pipefail

target_branch="${1:-main}"
source_branch="${2:-stable}"
remote="${3:-origin}"

current_ref="$(git symbolic-ref --quiet --short HEAD || true)"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Required command not found: $1" >&2
        exit 1
    fi
}

cleanup() {
    if [[ -n "$current_ref" ]]; then
        git checkout "$current_ref" >/dev/null 2>&1 || true
    fi
}

trap cleanup EXIT

require_command git
require_command date

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "This script must be run from inside a Git repository." >&2
    exit 1
fi

if ! git remote get-url "$remote" >/dev/null 2>&1; then
    echo "Remote '$remote' does not exist." >&2
    exit 1
fi

if ! git ls-remote --exit-code --heads "$remote" "$target_branch" >/dev/null 2>&1; then
    echo "Remote branch '$remote/$target_branch' does not exist." >&2
    exit 1
fi

if ! git ls-remote --exit-code --heads "$remote" "$source_branch" >/dev/null 2>&1; then
    echo "Remote branch '$remote/$source_branch' does not exist." >&2
    exit 1
fi

echo "Fetching '$remote/$target_branch' and '$remote/$source_branch'..."
git fetch "$remote" "$target_branch" "$source_branch"

target_ref="$remote/$target_branch"
source_ref="$remote/$source_branch"
target_sha="$(git rev-parse "$target_ref")"
timestamp="$(date +%Y-%m-%d-%H%M%S)"
tag_name="${target_branch}-archive-$timestamp"

echo "Creating archive tag '$tag_name' at '$target_ref' ($target_sha)..."
git tag "$tag_name" "$target_sha"
git push "$remote" "$tag_name"

if git show-ref --verify --quiet "refs/heads/$target_branch"; then
    git checkout "$target_branch"
else
    git checkout -b "$target_branch" "$target_ref"
fi

echo "Resetting '$target_branch' to '$source_ref'..."
git reset --hard "$source_ref"

echo "Force-pushing '$target_branch' to '$remote' with lease protection..."
git push --force-with-lease "$remote" "$target_branch"

echo
echo "Completed successfully."
echo "- '$target_branch' now matches '$source_ref'"
echo "- Previous $target_branch state archived as tag '$tag_name'"