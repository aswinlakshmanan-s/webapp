#!/bin/bash
set -e

echo "Setting up systemd service for the Node.js application..."

sudo tee /etc/systemd/system/csye6225.service > /dev/null <<'EOF'
[Unit]
Description=CSYE6225 Node.js Application
After=network.target postgresql.service

[Service]
User=csye6225
Group=csye6225
WorkingDirectory=/opt/csye6225/webapp
EnvironmentFile=/opt/csye6225/webapp/.env
ExecStart=/usr/bin/node /opt/csye6225/webapp/app.js
Restart=always
StandardOutput=append:/var/log/csye6225.log
StandardError=append:/var/log/csye6225.log

[Install]
WantedBy=multi-user.target
EOF

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling csye6225 service..."
sudo systemctl enable csye6225.service

echo "Starting csye6225 service..."
sudo systemctl start csye6225.service

echo "Systemd service configuration complete."