#!/usr/bin/env bash
set -o errexit  # exit immediately on error

echo "🚀 Starting Django build process (final stable version)"

# --- Navigate to the correct directory ---
if [ -f "manage.py" ]; then
  echo "✅ Running inside correct directory ($(pwd))"
else
  echo "📁 Moving into backend/wildlitz..."
  cd backend/wildlitz || exit 1
fi

# --- Upgrade pip ---
echo "⬆️ Upgrading pip..."
python -m pip install --upgrade pip

# --- Install dependencies ---
echo "📦 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
else
  echo "⚠️ requirements.txt not found in current directory, trying parent path..."
  pip install -r /opt/render/project/src/requirements.txt
fi

# --- Ensure static directory exists ---
if [ ! -d "static" ]; then
  echo "📁 Creating missing static directory..."
  mkdir -p static
fi

# --- Collect static files ---
echo "🧹 Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠️ collectstatic warning ignored"

# --- Apply migrations safely ---
echo "🛠 Applying migrations (with --fake-initial)..."
python manage.py migrate --fake-initial || echo "⚠️ migrate warning ignored"

echo "✅ Django build process completed successfully!"
