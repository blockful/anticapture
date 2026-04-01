#!/bin/sh
mkdir -p /loki/chunks /loki/wal
chown -R 10001:10001 /loki
exec /usr/bin/loki -config.file=/etc/loki/local-config.yaml -config.expand-env=true "$@"
