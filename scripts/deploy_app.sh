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

# Check if an .env file exists in the artifact; if so, copy it over.
if [ -f .env ]; then
  echo ".env file found in artifact; copying to /opt/csye6225/webapp/..."
  sudo cp .env /opt/csye6225/webapp/.env
  sudo chown csye6225:csye6225 /opt/csye6225/webapp/.env
else
  echo "No .env file found in artifact; creating one from environment variables..."
  export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD DB_DIALECT NODE_ENV
  cat <<EOF > /tmp/.env.temp
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DIALECT=${DB_DIALECT}
NODE_ENV=${NODE_ENV}
EOF
  sudo -E mv /tmp/.env.temp /opt/csye6225/webapp/.env
  sudo chown csye6225:csye6225 /opt/csye6225/webapp/.env
fi

echo "Application deployed successfully."
