#!/bin/bash
set -e

echo "Creating application directory /opt/csye6225/webapp..."
sudo mkdir -p /opt/csye6225/webapp

echo "Installing unzip (if not installed)..."
sudo apt-get update -y && sudo apt-get install -y unzip

echo "Deploying application artifact..."
sudo unzip /tmp/webapp-fork.zip -d /opt/csye6225/webapp

echo "Installing Node.js application dependencies..."
cd /opt/csye6225/webapp
sudo npm install

echo "Setting ownership of /opt/csye6225/webapp to csye6225..."
sudo chown -R csye6225:csye6225 /opt/csye6225/webapp

echo "Injecting DB secrets into .env file..."
cat <<EOF > /tmp/.env.temp
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-csye6225_db}
DB_USER=${DB_USER:-csye6225}
DB_PASSWORD=${DB_PASSWORD:-change_me}
DB_DIALECT=${DB_DIALECT:-postgres}
NODE_ENV=${NODE_ENV:-production}
EOF
sudo mv /tmp/.env.temp /opt/csye6225/webapp/.env
sudo chown csye6225:csye6225 /opt/csye6225/webapp/.env
echo ".env file created in /opt/csye6225/webapp."

echo "Application deployed successfully."
