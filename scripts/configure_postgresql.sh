#!/bin/bash
set -e

echo "Configuring PostgreSQL database..."

# Check if DB secrets are set
if [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Error: Missing required database secrets! Ensure DB_PASSWORD and DB_NAME are set."
  exit 1
fi

echo "Creating database '$DB_NAME' (if not exists)..."
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";" || true

echo "Setting PostgreSQL user password and granting privileges..."
sudo -u postgres psql <<EOF
ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO postgres;
EOF

echo "PostgreSQL database configuration complete."
