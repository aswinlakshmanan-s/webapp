#!/bin/bash
set -e

echo "Configuring PostgreSQL database..."

# Check if DB secrets are set
if [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
  echo "Error: Missing required database secrets! Ensure DB_PASSWORD, DB_NAME, and DB_USER are set."
  exit 1
fi

echo "Creating database '$DB_NAME' (if not exists)..."
sudo -u postgres psql -c "CREATE DATABASE \"$DB_NAME\";" || true

echo "Ensuring database user '$DB_USER' exists and setting password..."
sudo -u postgres psql -c "DO \$\$ BEGIN 
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END \$\$;"

echo "Granting privileges on database '$DB_NAME' to user '$DB_USER'..."
sudo -u postgres psql <<EOF
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO $DB_USER;
EOF

echo "PostgreSQL database configuration complete."
