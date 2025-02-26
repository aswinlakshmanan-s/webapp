#!/bin/bash
set -e

# Export the expected environment variables so they're available later
export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD DB_DIALECT NODE_ENV

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

# Debug: Print one of the variables to check if they are available
echo "DEBUG: DB_HOST is: $DB_HOST"

# Create .env file using the environment variables if it doesn't exist
if [ ! -f /opt/csye6225/webapp/.env ]; then
  echo "No .env file found. Creating default .env file..."
  cat <<EOF > /tmp/.env.temp
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DIALECT=${DB_DIALECT}
NODE_ENV=${NODE_ENV}
EOF
  # Use sudo -E to preserve the environment during the move
  sudo -E mv /tmp/.env.temp /opt/csye6225/webapp/.env
  sudo chown csye6225:csye6225 /opt/csye6225/webapp/.env
  echo ".env file created in /opt/csye6225/webapp."
else
  echo ".env file already exists, skipping creation."
fi

echo "Application deployed successfully."
