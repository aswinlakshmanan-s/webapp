#!/bin/bash
set -e

echo "Setting up systemd service for the Node.js application..."

# Copy the service file (csye6225.service) from the repository to /etc/systemd/system/
sudo cp ../csye6225.service /etc/systemd/system/csye6225.service

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling csye6225 service..."
sudo systemctl enable csye6225.service

echo "Starting csye6225 service..."
sudo systemctl start csye6225.service

echo "Systemd service setup complete."
