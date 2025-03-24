#!/bin/bash
set -e

echo "Creating log directory at /var/log/app..."
sudo mkdir -p /var/log/app
sudo chown csye6225:csye6225 /var/log/app
echo "Log directory created and ownership set to csye6225:csye6225."
