#!/bin/bash

sudo killall node
sudo killall mongo
sudo killall mongod
sudo mongod --dbpath=/data &
sudo node ~/Flow-backend/index.js >> /var/log/George/backend.txt

