#!/bin/bash
set -e

# Starting Git removal check...
echo "Starting Git removal check..."

# Check if git is installed
if which git > /dev/null; then
  echo "Git is currently installed. Proceeding with removal..."
  
  # Remove git and autoremove dependencies
  sudo apt-get remove -y git || sudo yum remove -y git
  sudo apt-get autoremove -y || sudo yum autoremove -y
fi

# Verifying Git removal status
if which git > /dev/null; then
  echo "ERROR: Git is still present. AMI requirements are not met!"
  exit 1
else
  echo "SUCCESS: Git has been successfully removed, as required by AMI specifications."
fi
