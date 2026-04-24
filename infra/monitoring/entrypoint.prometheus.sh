#!/bin/sh
envsubst < /etc/prometheus/prometheus.yml.tmpl > /etc/prometheus/prometheus.yml
if [ ! -f /prometheus/.initialized ]; then
  rm -rf /prometheus/*
  touch /prometheus/.initialized
fi
exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --web.enable-lifecycle --web.enable-remote-write-receiver "$@"
