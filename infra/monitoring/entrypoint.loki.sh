#!/bin/sh
mkdir -p /loki/chunks /loki/wal
chown -R 10001:10001 /loki
exec /sbin/su-exec 10001 /usr/bin/loki -config.file=/etc/loki/local-config.yaml -config.expand-env=true "$@"
