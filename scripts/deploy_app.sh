#!/bin/bash
set -e

# Create the application directory
sudo mkdir -p /opt/myapp

# Install unzip if not present
sudo apt-get install -y unzip

# Unzip the Node.js application artifact into /opt/myapp
sudo unzip /tmp/webapp.zip -d /opt/myapp

# Change directory to the app folder and install Node.js dependencies
cd /opt/myapp
sudo npm install

# Change ownership of the application files to csye6225
sudo chown -R csye6225:csye6225 /opt/myapp
