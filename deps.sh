#!/bin/bash
set -o errexit

ln -s ./bin/phantomjs /bin/

echo "linked?"
echo "ls -l /bin/phantom*.."
ls -l /bin/phantom*

# Install dropbear
apt-get -q update
apt-get install -y dropbear
