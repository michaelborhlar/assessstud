#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py makemigrations accounts
python manage.py makemigrations
python manage.py migrate accounts
python manage.py migrate
python manage.py seed_classes
