#!/bin/sh
envsubst < /etc/prometheus/prometheus.yml.tmpl > /etc/prometheus/prometheus.yml
exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --web.enable-lifecycle "$@"
