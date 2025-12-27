#!/bin/bash
set -e

# === CONFIG ===
GITHUB_USER="YOUR_GITHUB_USERNAME"
GITHUB_REPO="iran-price-telegraph"
GITHUB_TOKEN="YOUR_GITHUB_TOKEN"  # or use GH CLI auth
CLOUDFLARE_KV_NAMESPACE="PRICE_KV"
PROJECT_DIR="iran-price-telegraph"
TELEGRAPH_TOKEN="PUT_YOUR_TELEGRAPH_TOKEN_HERE"
# ==============

# Step 0: Make sure project dir exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Project directory '$PROJECT_DIR' does not exist!"
  exit 1
fi

cd "$PROJECT_DIR"

# Step 1: Initialize Git (if not)
if [ ! -d ".git" ]; then
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$GITHUB_REPO.git
else
  git add .
  git commit -m "Update code $(date +"%Y-%m-%d %H:%M:%S")" || true
fi

# Step 2: Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main --force

# Step 3: Check if KV namespace exists, if not create it
KV_LIST=$(wrangler kv:namespace list)
if ! echo "$KV_LIST" | grep -q "$CLOUDFLARE_KV_NAMESPACE"; then
  echo "Creating KV namespace..."
  KV_ID=$(wrangler kv:namespace create "$CLOUDFLARE_KV_NAMESPACE" --json | jq -r '.id')
  echo "KV Namespace ID: $KV_ID"
  # update wrangler.toml
  sed -i "s/id = .*/id = \"$KV_ID\"/" wrangler.toml
else
  echo "KV namespace exists."
fi

# Step 4: Deploy worker
echo "Deploying Worker..."
wrangler publish

echo "✅ Deployment finished!"
