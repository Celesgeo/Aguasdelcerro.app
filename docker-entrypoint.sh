#!/bin/sh
set -e
mkdir -p /app/data/careers
# Un volumen de Railway suele montarse como root; el proceso nextjs tiene que poder escribir CVs.
chown -R nextjs:nodejs /app/data 2>/dev/null || true
chmod -R u+rwX /app/data 2>/dev/null || true
if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs:nodejs node server.js
fi
exec node server.js
