#!/bin/sh
sed "s|\${SLACK_WEBHOOK_URL}|${SLACK_WEBHOOK_URL}|g;s|\${SLACK_CHANNEL}|${SLACK_CHANNEL}|g" /etc/alertmanager/config.yml.tmpl > /etc/alertmanager/config.yml
exec /bin/alertmanager --config.file=/etc/alertmanager/config.yml --storage.path=/alertmanager ${ALERTMANAGER_EXTERNAL_URL:+--web.external-url="$ALERTMANAGER_EXTERNAL_URL"} "$@"
