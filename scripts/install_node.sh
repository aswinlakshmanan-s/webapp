#!/bin/bash
set -e

# Update package repositories
sudo apt-get update -y

# Install curl if not already installed
sudo apt-get install -y curl

# Install Node.js 18 via NodeSource
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
