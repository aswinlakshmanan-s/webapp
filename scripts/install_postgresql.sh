#!/bin/bash
set -e

# Update package repositories
sudo apt-get update -y

# Install PostgreSQL and its contrib package
sudo apt-get install -y postgresql postgresql-contrib

# Enable and start PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql
