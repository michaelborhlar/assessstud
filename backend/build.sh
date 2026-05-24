#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py makemigrations --no-input
python manage.py migrate
python manage.py seed_classes
python manage.py shell -c "
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts_visitorlog (
            id BIGSERIAL PRIMARY KEY,
            ip_address INET,
            path VARCHAR(500) NOT NULL DEFAULT \\'\\',
            user_agent VARCHAR(500) NOT NULL DEFAULT \\'\\',
            visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            user_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS accounts_visitorlog_visited_at 
        ON accounts_visitorlog(visited_at DESC);
    ''')
    print('VisitorLog table created successfully')
"
