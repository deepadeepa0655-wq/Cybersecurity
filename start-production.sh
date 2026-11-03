#!/usr/bin/env bash
set -euo pipefail

APP_NAME="CyberQuest"
PORT="${PORT:-5000}"
NODE_ENV="${NODE_ENV:-production}"

if [[ ! "${PORT}" =~ ^[0-9]{1,5}$ ]]; then
  echo "PORT must be a number from 1 to 65535." >&2
  exit 1
fi
PORT_NUMBER=$((10#${PORT}))
if (( PORT_NUMBER < 1 || PORT_NUMBER > 65535 )); then
  echo "PORT must be a number from 1 to 65535." >&2
  exit 1
fi
PORT="${PORT_NUMBER}"

export PORT NODE_ENV
echo "Starting ${APP_NAME} in ${NODE_ENV} mode on port ${PORT}."
exec node server.js
