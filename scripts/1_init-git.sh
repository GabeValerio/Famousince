#!/bin/bash

set -e
source "$(dirname "$0")/config.env.project"

echo "📁 Project name: $PROJECT_NAME"
echo "🔗 GitHub URL: $GITHUB_URL"

# Check if we're in the project directory, if not cd into it
if [ "$(basename "$PWD")" != "$PROJECT_NAME" ]; then
  echo "📂 Moving into project directory..."
  cd "$(dirname "$0")/.."
  if [ "$(basename "$PWD")" != "$PROJECT_NAME" ]; then
    echo "❌ Error: Not in project directory and couldn't find it"
    exit 1
  fi
fi

# Extract user/repo from SSH URL
# Example: git@github.com:GabeValerio/CruzeStreet.git
REPO_PATH=$(echo "$GITHUB_URL" | sed 's#.*github.com:##' | sed 's#.git##')
REPO_NAME=$(basename "$REPO_PATH")
GITHUB_USERNAME=$(dirname "$REPO_PATH")

# Always clean existing Git history (fresh start)
if [ -d ".git" ]; then
  echo "🧹 Removing existing .git history..."
  rm -rf .git
fi

# Create GitHub repo if it doesn't exist
if gh repo view "$GITHUB_USERNAME/$REPO_NAME" > /dev/null 2>&1; then
  echo "✅ Repo $REPO_NAME already exists on GitHub."
else
  echo "📦 Repo not found. Creating it on GitHub..."
  gh repo create "$GITHUB_USERNAME/$REPO_NAME" --public
  echo "✅ Repo created!"
fi

# Initialize new clean Git repo
echo "🔧 Initializing clean Git repo..."
git init
touch README.md
git add .
git commit -m "Clean initial commit for $REPO_NAME"
git branch -M main
git remote add origin "$GITHUB_URL"

# Force push clean code to GitHub...
echo "🚀 Force pushing clean code to GitHub..."
git push -f -u origin main
