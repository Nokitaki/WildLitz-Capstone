#!/usr/bin/env bash
set -e

echo "🚀 Running build.sh from root directory"

# Go into backend/wildlitz where manage.py lives
cd backend/wildlitz

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r /opt/render/project/src/requirements.txt

# Collect static files and run migrations
python manage.py collectstatic --noinput
python manage.py migrate
