#!/bin/sh
envsubst < /etc/prometheus/prometheus.yml.tmpl > /etc/prometheus/prometheus.yml
exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.enable-lifecycle \
  --web.enable-remote-write-receiver \
  --log.level="${PROMETHEUS_LOG_LEVEL:-debug}" \
  --log.format="${PROMETHEUS_LOG_FORMAT:-json}" \
  "$@"
