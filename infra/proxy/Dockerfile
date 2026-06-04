FROM nginx:1.27-alpine

# Reverse proxy fronting the docs and MCP services on Railway. Railway
# terminates TLS at the edge and injects $PORT, and the backends are reached
# over the private network (*.railway.internal, IPv6). The official nginx image
# runs envsubst over /etc/nginx/templates/*.template at startup and writes the
# result to /etc/nginx/conf.d/, so $PORT and the upstream host:port values are
# all driven by Railway environment variables.
#
# Defaults below are placeholders: override DOCS_UPSTREAM / MCP_UPSTREAM on the
# Railway service to match the real backend service names and listening ports
# (see README.md). PORT is injected by Railway in production.
ENV PORT=8080 \
    DOCS_UPSTREAM=mcp-docs.railway.internal:3001 \
    MCP_UPSTREAM=mcp-server.railway.internal:3100

# Restrict envsubst to our own variables so nginx runtime variables ($host,
# $uri, $http_upgrade, ...) in the template are left untouched.
ENV NGINX_ENVSUBST_FILTER='^(PORT|DOCS_UPSTREAM|MCP_UPSTREAM)$'

COPY infra/proxy/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
