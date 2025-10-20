#!/usr/bin/env bash
set -e  # safer version of errexit

echo "===================================="
echo "🚀 STARTING BUILD.SH"
echo "Current directory:"
pwd
echo "Files in root:"
ls -l
echo "===================================="

# Go to backend/wildlitz where manage.py lives
cd backend/wildlitz || exit 1

echo "Now inside backend/wildlitz"
pwd
echo "Listing contents:"
ls -l
echo "===================================="

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies (using absolute path to be sure)
echo "Installing dependencies from /opt/render/project/src/requirements.txt ..."
pip install -r /opt/render/project/src/requirements.txt

echo "===================================="
echo "✅ Finished installing packages"
echo "===================================="

# Collect static files and run migrations
python manage.py collectstatic --noinput
python manage.py migrate

echo "===================================="
echo "🏁 BUILD.SH FINISHED SUCCESSFULLY"
echo "===================================="
