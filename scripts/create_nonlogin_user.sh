#!/bin/bash
set -e

# Create the csye6225 group if it doesn't already exist
sudo groupadd -f csye6225

# Create the csye6225 user with no login shell (ignore error if user exists)
sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225 || true
