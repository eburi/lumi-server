#!/bin/bash

set -o errexit

apt-get -q update
apt-get install -y cowsay
/usr/games/cowsay "Install dependencies using a script like this!"




cd /tmp
wget https://github.com/aeberhardo/phantomjs-linux-armv6l/archive/master.zip
unzip master.zip
cd phantomjs-linux-armv6l-master
bunzip2 *.bz2 && tar xf *.tar

ln -s ./bin/phantomjs /bin/
