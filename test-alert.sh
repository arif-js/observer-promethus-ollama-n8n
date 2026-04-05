#!/bin/bash

# Test script to trigger and resolve the critical alert
# Make sure the app is running on localhost:3000

case "$1" in
    "trigger")
        curl http://localhost:3000/trigger-alert
        echo -e "\nCritical alert gauge set to 1."
        ;;
    "resolve")
        curl http://localhost:3000/clear-alert
        echo -e "\nAlert cleared. Gauge set to 0."
        ;;
    *)
        echo "Usage: ./test-alert.sh [trigger|resolve]"
        exit 1
        ;;
esac
