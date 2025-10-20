#!/usr/bin/env bash
set -o errexit

cd backend/wildlitz

python -m pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate
