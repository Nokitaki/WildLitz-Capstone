#!/usr/bin/env bash
set -e

echo "🚀 Starting Django build process (final clean version)"

# Since Render already starts inside backend/wildlitz, check first
if [ -f "manage.py" ]; then
  echo "✅ Running from backend/wildlitz"
else
  echo "📁 Moving into backend/wildlitz"
  cd backend/wildlitz
fi

python -m pip install --upgrade pip

# Install dependencies
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
else
  pip install -r /opt/render/project/src/requirements.txt
fi

python manage.py collectstatic --noinput
python manage.py migrate

echo "✅ Build finished successfully!"
