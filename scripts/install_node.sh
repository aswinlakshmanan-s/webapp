#!/bin/bash
set -e

echo "Updating package repositories..."
sudo apt-get update -y

echo "Installing curl..."
sudo apt-get install -y curl

echo "Installing Node.js 18..."
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Node.js installation complete."
