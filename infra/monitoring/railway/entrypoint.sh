#!/bin/sh
sed "s|\${SLACK_WEBHOOK_URL}|${SLACK_WEBHOOK_URL}|g" /etc/alertmanager/config.yml.tmpl > /etc/alertmanager/config.yml
exec /bin/alertmanager --config.file=/etc/alertmanager/config.yml --storage.path=/alertmanager "$@"
