#!/bin/bash
set -e

echo "Updating package repositories..."
sudo apt-get update -y

echo "Downloading Amazon CloudWatch Agent package..."
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb

echo "Installing Amazon CloudWatch Agent..."
sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb

echo "Cleaning up..."
sudo rm /tmp/amazon-cloudwatch-agent.deb

echo "CloudWatch Agent installation complete."
