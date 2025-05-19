#!/bin/sh
set -e

echo "Running migrations..."
pnpm run petition db:migrate

echo "Starting app..."
pnpm run petition start
