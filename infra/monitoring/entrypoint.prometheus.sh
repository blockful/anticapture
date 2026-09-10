#!/bin/sh
envsubst < /etc/prometheus/prometheus.yml.tmpl > /etc/prometheus/prometheus.yml

# Append the 3 scrape jobs per DAO. Adding a DAO = add its name to DAOS (plus
# its <DAO>_INDEXER_ENDPOINT / <DAO>_API_ENDPOINT vars).
#
# DAO APIs run with several Railway replicas behind one private hostname. A
# static <host>:<port> target lands on a different replica at every scrape, so
# counters appear to reset constantly and rate()/increase() report thousands of
# times the real traffic. The API job therefore resolves the hostname's AAAA
# records (one per replica) and scrapes each replica as its own target.
DAOS="${DAOS:-ens aave shutter scroll nouns gitcoin compound uniswap obol}"
for dao in $DAOS; do
  DAO=$(echo "$dao" | tr '[:lower:]-' '[:upper:]_')
  eval indexer=\"\$${DAO}_INDEXER_ENDPOINT\"
  eval api=\"\$${DAO}_API_ENDPOINT\"
  api_host="${api%:*}"
  api_port="${api##*:}"
  cat >> /etc/prometheus/prometheus.yml <<EOF

  - job_name: anticapture-${dao}-indexer
    metrics_path: "/otel-metrics"
    scrape_interval: 15s
    static_configs:
      - targets: ["${indexer}"]

  - job_name: anticapture-${dao}-indexer-ponder
    metrics_path: "/metrics"
    scrape_interval: 15s
    static_configs:
      - targets: ["${indexer}"]

  - job_name: anticapture-${dao}-api
    metrics_path: "/metrics"
    scrape_interval: 15s
    dns_sd_configs:
      - names: ["${api_host}"]
        type: AAAA
        port: ${api_port}
        refresh_interval: 30s
EOF
done

exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --storage.tsdb.retention.time=180d --storage.tsdb.retention.size=40GB --web.enable-lifecycle --web.enable-remote-write-receiver "$@"
