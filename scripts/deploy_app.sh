#!/bin/bash
set -e

echo "Creating application directory /opt/myapp..."
sudo mkdir -p /opt/myapp

echo "Installing unzip (if not installed)..."
sudo apt-get update -y && sudo apt-get install -y unzip

echo "Deploying application artifact..."
sudo unzip /tmp/webapp-fork.zip -d /opt/myapp

echo "Installing Node.js application dependencies..."
cd /opt/myapp
sudo npm install

echo "Setting ownership of /opt/myapp to csye6225..."
sudo chown -R csye6225:csye6225 /opt/myapp

# Optionally, if the artifact doesn't include the .env file, create it using default values:
if [ ! -f /opt/myapp/.env ]; then
  echo "No .env file found. Creating default .env file..."
  cat <<EOF > /tmp/.env.temp
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-csye6225_db}
DB_USER=${DB_USER:-csye6225}
DB_PASSWORD=${DB_PASSWORD:-change_me}
DB_DIALECT=${DB_DIALECT:-postgres}
NODE_ENV=${NODE_ENV:-production}
EOF
  sudo mv /tmp/.env.temp /opt/myapp/.env
  sudo chown csye6225:csye6225 /opt/myapp/.env
  echo ".env file created in /opt/myapp."
else
  echo ".env file already exists, skipping creation."
fi

echo "Application deployed successfully."
