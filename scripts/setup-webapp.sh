#!/bin/bash

# Configuration
BASE_DIR="/opt/csye6225"
APP_DIR="$BASE_DIR/webapp-fork"
LINUX_GROUP="csye6225_cloud"
LINUX_USER="aswin"
ZIP_FILE="/tmp/webapp-fork.zip"

# Log function to include timestamp
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Ensure script is run as root
[ "$EUID" -ne 0 ] && error_exit "Run this script as root."

# Get database configuration from user
log "Gathering database configuration..."
read -p "Enter the database username: " DB_USER
[ -z "$DB_USER" ] && error_exit "Database username cannot be empty."

read -p "Enter the database name: " DB_NAME
[ -z "$DB_NAME" ] && error_exit "Database name cannot be empty."

read -sp "Enter the database password: " DB_PASSWORD
echo
[ -z "$DB_PASSWORD" ] && error_exit "Database password cannot be empty."

# Update and install packages
log "Updating system and installing required packages..."
sudo apt update && sudo apt upgrade -y && sudo apt install -y postgresql postgresql-contrib unzip npm nodejs || error_exit "Failed to install packages."

# Configure PostgreSQL
log "Configuring PostgreSQL..."
sudo -u postgres psql <<EOF || error_exit "Failed to configure PostgreSQL."
ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER WITH SUPERUSER;
EOF

# Create group and user
log "Creating Linux group and user..."
groupadd -f "$LINUX_GROUP"
id -u "$LINUX_USER" &>/dev/null || useradd -m -g "$LINUX_GROUP" -s /bin/bash "$LINUX_USER"

# Unzip application
log "Unzipping application..."
[ -f "$ZIP_FILE" ] || error_exit "ZIP file $ZIP_FILE not found."
mkdir -p "$BASE_DIR"
unzip -o "$ZIP_FILE" -d "$BASE_DIR" || error_exit "Failed to unzip application."

# Set ownership and permissions
log "Setting ownership and permissions..."
chown -R "$LINUX_USER:$LINUX_GROUP" "$BASE_DIR"
chmod -R 750 "$BASE_DIR"

# Install application dependencies
log "Installing Node.js dependencies..."
[ -f "$APP_DIR/package.json" ] || error_exit "package.json not found in $APP_DIR."
sudo -u "$LINUX_USER" bash -c "cd '$APP_DIR' && npm install" || error_exit "Failed to install dependencies."

# Start application
log "Starting the Node.js server..."
sudo -u "$LINUX_USER" bash -c "cd '$APP_DIR' && node app.js" || error_exit "Failed to start the Node.js server."

log "Setup completed successfully"


