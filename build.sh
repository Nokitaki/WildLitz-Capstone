#!/usr/bin/env bash
set -o errexit

echo "=== DEBUG: Current directory ==="
pwd
echo "=== DEBUG: Listing contents ==="
ls -R

# Move into Django backend folder
cd backend/wildlitz

echo "=== DEBUG: Inside backend/wildlitz ==="
pwd
ls

# Upgrade pip
python -m pip install --upgrade pip

# Use absolute path to requirements.txt
pip install -r /opt/render/project/src/requirements.txt

# Collect static files and run migrations
python manage.py collectstatic --noinput
python manage.py migrate
