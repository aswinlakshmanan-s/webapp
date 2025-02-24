#!/bin/bash
set -e

echo "Starting PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "Waiting for PostgreSQL to start..."
sleep 10

# Check for required secrets
if [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Error: Missing required database secrets! Ensure DB_PASSWORD and DB_NAME are set."
  exit 1
fi

echo "Creating database '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";"

echo "Configuring PostgreSQL Database..."
sudo -u postgres psql <<EOF
ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO postgres;
EOF

echo "PostgreSQL configuration complete."
