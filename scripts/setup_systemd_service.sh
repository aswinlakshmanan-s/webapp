#!/bin/bash
set -e

echo "Setting up systemd service for the Node.js application..."

# Create the systemd service file directly via heredoc.
sudo tee /etc/systemd/system/csye6225.service > /dev/null <<'EOF'
[Unit]
Description=CSYE6225 Node.js Application
After=network.target postgresql.service

[Service]
User=csye6225
Group=csye6225
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node /opt/myapp/app.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling csye6225 service..."
sudo systemctl enable csye6225.service

echo "Starting csye6225 service..."
sudo systemctl start csye6225.service

echo "Systemd service setup complete."
