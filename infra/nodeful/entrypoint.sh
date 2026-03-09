#!/bin/sh
set -e

# Start tailscaled in the background (userspace networking, no persistent state)
tailscaled --tun=userspace-networking --state=mem: &
sleep 2

# Authenticate and advertise Railway's private network
tailscale up \
  --authkey="${TAILSCALE_AUTHKEY}" \
  --hostname="${TAILSCALE_HOSTNAME:-railway-proxy}" \
  --accept-dns=false

# Forward traffic from Railway private network to your Tailscale machine
# Configure these via environment variables in Railway:
#   FORWARD_TARGET_IP   - Tailscale IP of your server (e.g. 100.64.1.5)
#   FORWARD_TARGET_PORT - Port on your server (e.g. 8080)
#   FORWARD_LISTEN_PORT - Port to listen on inside Railway (defaults to FORWARD_TARGET_PORT)

LISTEN_PORT="${FORWARD_LISTEN_PORT:-$FORWARD_TARGET_PORT}"

if [ -n "$FORWARD_TARGET_IP" ] && [ -n "$FORWARD_TARGET_PORT" ]; then
  echo "Forwarding port ${LISTEN_PORT} -> ${FORWARD_TARGET_IP}:${FORWARD_TARGET_PORT} (via tailscale nc)"
  socat TCP6-LISTEN:${LISTEN_PORT},fork,reuseaddr EXEC:"tailscale nc ${FORWARD_TARGET_IP} ${FORWARD_TARGET_PORT}" &
fi

# Keep the container alive
wait