#!/bin/bash

# Pull from the GitHub repository
git pull

# Install dependencies using pnpm
pnpm i

# Build the client using npm
npm run build

# Run migrations using npm
npm run migrations:run

# Restart the server using pm2
pm2 restart pm2.config.cjs
