#!/bin/bash
set -e

echo "Creating group 'csye6225' if not exists..."
sudo groupadd -f csye6225

echo "Creating non-login user 'csye6225'..."
sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225 || true

echo "User 'csye6225' created."
