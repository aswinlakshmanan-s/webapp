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

echo "Application deployed successfully."
