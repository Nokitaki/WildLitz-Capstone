#!/usr/bin/env bash
set -o errexit

# Navigate to Django backend folder
cd backend/wildlitz

# Upgrade pip
python -m pip install --upgrade pip

# Install backend dependencies
pip install -r ../../requirements.txt

# Collect static files and run migrations
python manage.py collectstatic --noinput
python manage.py migrate
