#!/bin/bash
set -e

echo "Configuring PostgreSQL database..."

# Check if DB secrets are set
if [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
  echo "Error: Missing required database secrets! Ensure DB_PASSWORD, DB_NAME, and DB_USER are set."
  exit 1
fi

# Create database if it doesn't exist
echo "Creating database '$DB_NAME' (if not exists)..."
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";" || true

# Ensure the database user exists and update its password
echo "Ensuring database user '$DB_USER' exists and setting password..."
sudo -u postgres psql -c "DO \$\$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;"

# Grant privileges on the database and schema to the user
echo "Granting privileges on database '$DB_NAME' and public schema to user '$DB_USER'..."
sudo -u postgres psql -d "$DB_NAME" <<EOF
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO $DB_USER;
GRANT USAGE, CREATE ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
EOF

echo "PostgreSQL database configuration complete."
