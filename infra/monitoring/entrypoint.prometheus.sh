#!/bin/sh
envsubst < /etc/prometheus/prometheus.yml.tmpl > /etc/prometheus/prometheus.yml

# Append the 3 scrape jobs per DAO. Adding a DAO = add its name to DAOS (plus
# its <DAO>_INDEXER_ENDPOINT / <DAO>_API_ENDPOINT vars).
DAOS="${DAOS:-ens aave shutter scroll nouns gitcoin compound uniswap obol}"
for dao in $DAOS; do
  DAO=$(echo "$dao" | tr '[:lower:]' '[:upper:]')
  eval indexer=\"\$${DAO}_INDEXER_ENDPOINT\"
  eval api=\"\$${DAO}_API_ENDPOINT\"
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
    static_configs:
      - targets: ["${api}"]
EOF
done

exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --storage.tsdb.retention.time=15d --web.enable-lifecycle --web.enable-remote-write-receiver "$@"
