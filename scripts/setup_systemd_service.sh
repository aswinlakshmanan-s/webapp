#!/bin/bash
set -e

# Create the systemd service file for the Node.js application
sudo tee /etc/systemd/system/csye6225.service > /dev/null <<'EOF'
[Unit]
Description=CSYE6225 Node.js Application
After=network.target

[Service]
User=csye6225
Group=csye6225
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node /opt/myapp/app.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd configuration, enable, and start the service
sudo systemctl daemon-reload
sudo systemctl enable csye6225.service
sudo systemctl start csye6225.service
