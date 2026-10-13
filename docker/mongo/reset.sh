#!/bin/sh
# Restores the demo data every day at DEMO_RESET_TIME (in TZ).
set -eu

while true; do
  now=$(date +%s)
  next=$(date -d "today $DEMO_RESET_TIME" +%s)
  [ "$next" -le "$now" ] && next=$(date -d "tomorrow $DEMO_RESET_TIME" +%s)
  echo "next reset: $(date -d "@$next")"
  sleep $((next - now))

  mongosh --quiet "mongodb://mongo:27017" \
    --username "$MONGO_USERNAME" --password "$MONGO_PASSWORD" --authenticationDatabase admin \
    --file /seed/seed.js && echo "demo data restored"
done
