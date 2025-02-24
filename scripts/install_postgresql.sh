#!/bin/bash
set -e

echo "Updating package repositories..."
sudo apt-get update -y

echo "Installing PostgreSQL and postgresql-contrib..."
sudo apt-get install -y postgresql postgresql-contrib

echo "Enabling and starting PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "Waiting for PostgreSQL to start..."
sleep 10

echo "PostgreSQL installation complete."
