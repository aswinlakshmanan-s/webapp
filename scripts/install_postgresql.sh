#!/bin/bash
set -e

# Update package repositories
sudo apt-get update -y

# Install PostgreSQL and its contrib package
sudo apt-get install -y postgresql postgresql-contrib

# Enable and start PostgreSQL service
echo "Starting PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "Creating database '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";"

echo "Configuring PostgreSQL Database..."
sudo -u postgres psql <<EOF
ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO postgres;
EOF