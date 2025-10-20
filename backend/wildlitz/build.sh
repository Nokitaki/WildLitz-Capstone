#!/usr/bin/env bash
set -e

echo "===================================="
echo "🚀 Running build.sh from root"
echo "Current path:"
pwd
echo "Contents of current directory:"
ls -la
echo "===================================="

# Check if backend exists
if [ -d "backend" ]; then
  echo "✅ Found backend directory"
  ls backend
else
  echo "❌ No backend directory found"
fi

# Check nested path
if [ -d "backend/wildlitz" ]; then
  echo "✅ Found backend/wildlitz directory"
  cd backend/wildlitz
else
  echo "❌ backend/wildlitz not found, trying other possibilities..."
  find . -type f -name "manage.py"
  exit 1
fi

echo "Now inside:"
pwd
ls -la

python -m pip install --upgrade pip
pip install -r /opt/render/project/src/requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
