#!/usr/bin/env bash
set -e

echo "🚀 Starting Django build process"

# Go to backend/wildlitz where manage.py lives
cd backend/wildlitz

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r /opt/render/project/src/requirements.txt

# Collect static files and run migrations
python manage.py collectstatic --noinput
python manage.py migrate

echo "✅ Build process finished successfully"
